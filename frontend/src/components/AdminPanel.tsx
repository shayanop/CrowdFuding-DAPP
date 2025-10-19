import { useEffect, useMemo, useState } from 'react'
import { getClients, getWallet } from '../lib/web3'
import { KYC_ABI } from '../lib/abi'
import { KYC_ADDRESS } from '../lib/addresses'

export default function AdminPanel() {
  const { publicClient, walletClient } = useMemo(() => getClients(), [])
  const [me, setMe] = useState<string>('')
  const [admin, setAdmin] = useState<string>('')
  const [address, setAddress] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [pending, setPending] = useState<string[]>([])
  const [pendingDetails, setPendingDetails] = useState<any[]>([])

  async function refreshPending() {
    try {
      const pendingAddresses = await publicClient.readContract({ 
        address: KYC_ADDRESS, 
        abi: KYC_ABI, 
        functionName: 'getAllPending' 
      }) as string[]
      
      setPending(pendingAddresses)
      
      // Get details for each pending address
      const details = await Promise.all(
        pendingAddresses.map(async (addr) => {
          const kycData = await publicClient.readContract({ 
            address: KYC_ADDRESS, 
            abi: KYC_ABI, 
            functionName: 'getKyc', 
            args: [addr] 
          }) as any
          return { address: addr, ...kycData }
        })
      )
      
      setPendingDetails(details)
    } catch (err) {
      console.error('Failed to refresh pending:', err)
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const w = await getWallet()
        if (w.account) setMe(w.account)
        const a = await publicClient.readContract({ address: KYC_ADDRESS, abi: KYC_ABI, functionName: 'admin' }) as string
        setAdmin(a)
        await refreshPending()
      } catch (err) {
        setError('Failed to load admin data')
      }
    })()
  }, [publicClient])

  async function approve(userAddress: string) {
    if (!me) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await walletClient.writeContract({ account: me as `0x${string}`, address: KYC_ADDRESS, abi: KYC_ABI, functionName: 'approve', args: [userAddress as `0x${string}`] })
      setSuccess(`Approved ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`)
      // Wait a bit for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 1000))
      await refreshPending()
    } catch (err: any) {
      setError(err.message || 'Failed to approve')
      console.error('Approval error:', err)
    } finally {
      setLoading(false)
    }
  }

  async function reject(userAddress: string, rejectReason: string) {
    if (!me) return
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      await walletClient.writeContract({ account: me as `0x${string}`, address: KYC_ADDRESS, abi: KYC_ABI, functionName: 'reject', args: [userAddress as `0x${string}`, rejectReason || 'Rejected by admin'] })
      setSuccess(`Rejected ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`)
      // Wait a bit for the transaction to be mined
      await new Promise(resolve => setTimeout(resolve, 1000))
      await refreshPending()
    } catch (err: any) {
      setError(err.message || 'Failed to reject')
      console.error('Rejection error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!me || me.toLowerCase() !== admin.toLowerCase()) {
    return (
      <div className="admin-panel">
        <h3>🔒 Admin Panel</h3>
        <p><strong>Access Denied:</strong> Only admin can access this panel</p>
        <p><em>Connect as Account #0 to access admin functions</em></p>
      </div>
    )
  }

  return (
    <div className="admin-panel">
      <h3>🔒 Admin Panel - KYC Management</h3>
      
      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="pending-list">
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
          <h4>📋 Pending KYC Requests ({pendingDetails.length})</h4>
          <button 
            onClick={refreshPending} 
            disabled={loading}
            style={{background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', padding: '0.5rem 1rem', fontSize: '0.875rem'}}
          >
            🔄 Refresh
          </button>
        </div>
        {pendingDetails.length === 0 ? (
          <p><em>No pending KYC requests</em></p>
        ) : (
          pendingDetails.map((req, index) => (
            <div key={req.address} className="pending-item">
              <div className="address">{req.address}</div>
              <div style={{flex: 1}}>
                <div><strong>Name:</strong> {req.fullName}</div>
                <div><strong>CNIC:</strong> {req.cnic}</div>
              </div>
              <div className="button-group">
                <button 
                  onClick={() => approve(req.address)} 
                  disabled={loading}
                  style={{background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'}}
                >
                  {loading ? <span className="loading"></span> : '✅ Approve'}
                </button>
                <input 
                  placeholder="Rejection reason" 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  disabled={loading}
                />
                <button 
                  onClick={() => reject(req.address, reason)} 
                  disabled={loading}
                  style={{background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)'}}
                >
                  {loading ? <span className="loading"></span> : '❌ Reject'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{marginTop: '1rem', padding: '1rem', background: '#f7fafc', borderRadius: '8px'}}>
        <h4>Manual KYC Actions</h4>
        <p><em>Enter user addresses to approve or reject their KYC requests</em></p>
        <div className="input-group">
          <input 
            placeholder="User address" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            disabled={loading}
          />
          <div className="button-group">
            <button 
              onClick={() => approve(address)} 
              disabled={loading || !address}
              style={{background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)'}}
            >
              {loading ? <span className="loading"></span> : '✅ Approve'}
            </button>
            <input 
              placeholder="Rejection reason" 
              value={reason} 
              onChange={(e) => setReason(e.target.value)} 
              disabled={loading}
            />
            <button 
              onClick={() => reject(address, reason)} 
              disabled={loading || !address}
              style={{background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)'}}
            >
              {loading ? <span className="loading"></span> : '❌ Reject'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}