import { useEffect, useMemo, useState } from 'react'
import { getClients, getWallet } from '../lib/web3'
import { KYC_ABI } from '../lib/abi'
import { KYC_ADDRESS } from '../lib/addresses'

export default function AdminPage() {
  const { publicClient, walletClient } = useMemo(() => getClients(), [])
  const [me, setMe] = useState<string>('')
  const [admin, setAdmin] = useState<string>('')
  const [address, setAddress] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [_pending, setPending] = useState<string[]>([])
  const [pendingDetails, setPendingDetails] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })

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
            args: [addr as `0x${string}`] 
          }) as any
          return { address: addr, ...kycData }
        })
      )
      
      setPendingDetails(details)

      // Update stats
      let approved = 0
      let rejected = 0
      details.forEach(d => {
        if (d.status === 2) approved++
        if (d.status === 3) rejected++
      })
      setStats({
        total: details.length,
        pending: pendingAddresses.length,
        approved,
        rejected
      })
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
      const hash = await walletClient.writeContract({ 
        account: me as `0x${string}`, 
        address: KYC_ADDRESS, 
        abi: KYC_ABI, 
        functionName: 'approve', 
        args: [userAddress as `0x${string}`] 
      })
      
      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({ hash })
      
      // Verify the status after confirmation
      const isVerified = await publicClient.readContract({
        address: KYC_ADDRESS,
        abi: KYC_ABI,
        functionName: 'isVerified',
        args: [userAddress as `0x${string}`]
      })
      
      if (!isVerified) {
        throw new Error('Verification failed to update')
      }
      
      setSuccess(`Successfully approved ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`)
      await refreshPending()
    } catch (err: any) {
      setError(err.message || 'Failed to approve')
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
      const hash = await walletClient.writeContract({ 
        account: me as `0x${string}`, 
        address: KYC_ADDRESS, 
        abi: KYC_ABI, 
        functionName: 'reject', 
        args: [userAddress as `0x${string}`, rejectReason || 'Rejected by admin'] 
      })

      // Wait for confirmation
      await publicClient.waitForTransactionReceipt({ hash })
      
      setSuccess(`Successfully rejected ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`)
      await refreshPending()
    } catch (err: any) {
      setError(err.message || 'Failed to reject')
    } finally {
      setLoading(false)
    }
  }

  if (!me || me.toLowerCase() !== admin.toLowerCase()) {
    return (
      <div className="container">
        <div className="access-denied">
          <h2>🔒 Admin Access Required</h2>
          <p><strong>Access Denied:</strong> Only admin can access this page</p>
          <p><em>Please connect with the admin account to access administrative functions</em></p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="admin-header">
        <h2>🔒 Admin Dashboard</h2>
        <p className="admin-subtitle">KYC Management System</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{stats.total}</h3>
          <p>Total Requests</p>
        </div>
        <div className="stat-card pending">
          <h3>{stats.pending}</h3>
          <p>Pending</p>
        </div>
        <div className="stat-card approved">
          <h3>{stats.approved}</h3>
          <p>Approved</p>
        </div>
        <div className="stat-card rejected">
          <h3>{stats.rejected}</h3>
          <p>Rejected</p>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="admin-section">
        <h3>📋 Pending KYC Requests ({pendingDetails.length})</h3>
        {pendingDetails.length === 0 ? (
          <div className="empty-state">
            <p>No pending KYC requests at this time</p>
          </div>
        ) : (
          <div className="requests-grid">
            {pendingDetails.map((req) => (
              <div key={req.address} className="request-card">
                <div className="request-header">
                  <span className="address-badge">{req.address.slice(0, 6)}...{req.address.slice(-4)}</span>
                  <span className="status-indicator">Pending</span>
                </div>
                <div className="request-body">
                  <div className="request-info">
                    <p><strong>Full Name:</strong> {req.fullName}</p>
                    <p><strong>CNIC:</strong> {req.cnic}</p>
                  </div>
                  <div className="request-actions">
                    <button 
                      onClick={() => approve(req.address)} 
                      disabled={loading}
                      className="approve-button"
                    >
                      {loading ? <span className="loading"></span> : '✅ Approve'}
                    </button>
                    <div className="reject-group">
                      <input 
                        placeholder="Reason for rejection" 
                        value={reason} 
                        onChange={(e) => setReason(e.target.value)} 
                        disabled={loading}
                      />
                      <button 
                        onClick={() => reject(req.address, reason)} 
                        disabled={loading}
                        className="reject-button"
                      >
                        {loading ? <span className="loading"></span> : '❌ Reject'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="admin-section">
        <h3>🔍 Manual KYC Actions</h3>
        <div className="manual-actions">
          <input 
            placeholder="Enter user address" 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
            disabled={loading}
            className="address-input"
          />
          <div className="action-buttons">
            <button 
              onClick={() => approve(address)} 
              disabled={loading || !address}
              className="approve-button"
            >
              {loading ? <span className="loading"></span> : '✅ Approve'}
            </button>
            <div className="reject-group">
              <input 
                placeholder="Reason for rejection" 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                disabled={loading}
              />
              <button 
                onClick={() => reject(address, reason)} 
                disabled={loading || !address}
                className="reject-button"
              >
                {loading ? <span className="loading"></span> : '❌ Reject'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}