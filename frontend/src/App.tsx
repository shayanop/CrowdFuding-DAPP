import { useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import { getWallet, getClients, type Web3State } from './lib/web3'
import { KYC_ABI, CROWDFUND_ABI } from './lib/abi'
import { KYC_ADDRESS, CROWDFUND_ADDRESS } from './lib/addresses'
import { formatEther, parseEther } from 'viem'
import AdminPage from './pages/AdminPage'
import './pages/AdminPage.css'



function Navigation() {
  const location = useLocation()
  const [isAdmin, setIsAdmin] = useState(false)
  const { publicClient } = useMemo(() => getClients(), [])

  useEffect(() => {
    (async () => {
      try {
        const w = await getWallet()
        if (w.account) {
          const admin = await publicClient.readContract({
            address: KYC_ADDRESS,
            abi: KYC_ABI,
            functionName: 'admin'
          }) as string
          setIsAdmin(w.account.toLowerCase() === admin.toLowerCase())
        }
      } catch (err) {
        console.error('Failed to check admin status:', err)
      }
    })()
  }, [publicClient])

  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          🌟 CrowdFund
        </Link>
      </div>
      <nav className="main-nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          <span>Home</span>
        </Link>
        {isAdmin && (
          <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
          <span>Admin Panel</span>
          </Link>
        )}
      </nav>
    </header>
  )
}



function MainContent() {
  const [web3, setWeb3] = useState<Web3State>({})
  const { publicClient, walletClient } = useMemo(() => getClients(), [])
  const [fullName, setFullName] = useState('')
  const [cnic, setCnic] = useState('')
  const [isVerified, setIsVerified] = useState<boolean>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [goalEth, setGoalEth] = useState('0.1')
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [contributeAmount, setContributeAmount] = useState('0.01')

  async function refreshVerificationStatus() {
    if (!web3.account) return
    try {
      const verified = await publicClient.readContract({ 
        address: KYC_ADDRESS, 
        abi: KYC_ABI, 
        functionName: 'isVerified', 
        args: [web3.account] 
      }) as boolean
      setIsVerified(verified)
    } catch (err) {
      console.error('Failed to refresh verification status:', err)
    }
  }

  async function refreshCampaigns() {
    try {
      const count = await publicClient.readContract({
        address: CROWDFUND_ADDRESS,
        abi: CROWDFUND_ABI,
        functionName: 'getCampaignCount'
      }) as bigint

      const list: any[] = []
      for (let i = 0n; i < count; i++) {
        const c = await publicClient.readContract({
          address: CROWDFUND_ADDRESS,
          abi: CROWDFUND_ABI,
          functionName: 'getCampaign',
          args: [i]
        }) as any
        list.push({ id: Number(i), ...c })
      }
      setCampaigns(list)
    } catch (err) {
      setError('Failed to load campaigns')
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const w = await getWallet()
        setWeb3(w)
        if (w.account) {
          await refreshVerificationStatus()
        }
        await refreshCampaigns()
      } catch (err) {
        setError('Failed to connect to wallet')
      }
    })()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function submitKyc() {
    if (!web3.account) return
    try {
      setLoading(true)
      setError('')
      await walletClient.writeContract({
        account: web3.account,
        address: KYC_ADDRESS,
        abi: KYC_ABI,
        functionName: 'submitKyc',
        args: [fullName, cnic]
      })
      setSuccess('KYC submitted successfully!')
      await refreshVerificationStatus()
      setFullName('')
      setCnic('')
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC')
    } finally {
      setLoading(false)
    }
  }

  async function createCampaign() {
    if (!web3.account) return
    try {
      setLoading(true)
      setError('')
      await walletClient.writeContract({
        account: web3.account,
        address: CROWDFUND_ADDRESS,
        abi: CROWDFUND_ABI,
        functionName: 'createCampaign',
        args: [title, desc, parseEther(goalEth)]
      })
      setSuccess('Campaign created successfully!')
      setTitle('')
      setDesc('')
      setGoalEth('0.1')
      await refreshCampaigns()
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign')
    } finally {
      setLoading(false)
    }
  }

  async function contribute(id: number) {
    if (!web3.account) return
    try {
      setLoading(true)
      setError('')
      await walletClient.writeContract({
        account: web3.account,
        address: CROWDFUND_ADDRESS,
        abi: CROWDFUND_ABI,
        functionName: 'contribute',
        args: [BigInt(id)],
        value: parseEther(contributeAmount)
      })
      setSuccess('Contribution successful!')
      setContributeAmount('0.01')
      await refreshCampaigns()
    } catch (err: any) {
      setError(err.message || 'Failed to contribute')
    } finally {
      setLoading(false)
    }
  }

  async function withdraw(id: number) {
    if (!web3.account) return
    try {
      setLoading(true)
      setError('')
      await walletClient.writeContract({
        account: web3.account,
        address: CROWDFUND_ADDRESS,
        abi: CROWDFUND_ABI,
        functionName: 'withdraw',
        args: [BigInt(id)]
      })
      setSuccess('Withdrawal successful!')
      await refreshCampaigns()
    } catch (err: any) {
      setError(err.message || 'Failed to withdraw')
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status: number) => {
    switch (status) {
      case 0: return 'status-active'
      case 1: return 'status-completed'
      case 2: return 'status-withdrawn'
      default: return 'status-active'
    }
  }

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Active'
      case 1: return 'Completed'
      case 2: return 'Withdrawn'
      default: return 'Unknown'
    }
  }

  return (
    <div className="app-container">
      <h1>Decentralized Crowdfunding DApp</h1>

      <div className="wallet-info">
        <strong>Wallet:</strong> {web3.account ? `${web3.account.slice(0, 6)}...${web3.account.slice(-4)}` : 'Not connected'} | 
        <strong>Chain:</strong> {web3.chainId || 'Unknown'} |
        <strong>Status:</strong> {isVerified ? '✅ Verified' : 'Not verified'}
      </div>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="section">
        <h2>KYC Verification</h2>
        <div style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem'}}>
          <p><strong>Status:</strong> {isVerified ? '✅ Verified' : 'Not Verified'}</p>
          <button
            onClick={refreshVerificationStatus}
            disabled={loading}
            style={{background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)', padding: '0.5rem 1rem', fontSize: '0.875rem'}}
          >
            Refresh Status
          </button>
        </div>

        {!isVerified && (
          <div className="input-group">
            <input
              placeholder="Full Name (e.g., Muhammad Shayan Ahmed)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
            <input
              placeholder="CNIC"
              value={cnic}
              onChange={(e) => setCnic(e.target.value)}
              disabled={loading}
            />
            <button onClick={submitKyc} disabled={loading || !fullName || !cnic}>
              {loading ? <span className="loading"></span> : 'Submit KYC'}
            </button>
          </div>
        )}

        <p><em>Note: Admin approval required. Connect as Account #0 to approve.</em></p>
      </div>

      {isVerified && (
        <div className="section">
          <h2>Create Campaign</h2>
          <p><em>Requires KYC verification</em></p>
          <div className="input-group">
            <input
              placeholder="Campaign Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
            <input
              placeholder="Description"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              disabled={loading}
            />
            <input
              type="number"
              step="0.1"
              min="0"
              placeholder="Goal (ETH)"
              value={goalEth}
              onChange={(e) => setGoalEth(e.target.value)}
              disabled={loading}
            />
            <button onClick={createCampaign} disabled={loading || !title || !desc || !goalEth || !isVerified}>
              {loading ? <span className="loading"></span> : 'Create Campaign'}
            </button>
          </div>
        </div>
      )}

      <div className="section">
        <h2>Active Campaigns</h2>
        {campaigns.length === 0 ? (
          <p>No campaigns yet. Create one above!</p>
        ) : (
          campaigns.map((c) => (
            <div key={c.id} className="campaign-card">
              <div className="campaign-title">{c.title}</div>
              <div className="campaign-description">{c.description}</div>
              <div className="campaign-stats">
                <div className="stat">
                  <div className="stat-label">Creator</div>
                  <div className="stat-value">
                    {c.creator.slice(0,6)}...{c.creator.slice(-4)}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-label">Goal</div>
                  <div className="stat-value">{formatEther(c.goal)} ETH</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Raised</div>
                  <div className="stat-value">{formatEther(c.raised)} ETH</div>
                </div>
                <div className="stat">
                  <div className="stat-label">Status</div>
                  <div className="stat-value">{getStatusText(Number(c.status))}</div>
                </div>
              </div>

              {Number(c.status) === 0 && (
                <div className="button-group">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Amount (ETH)"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    disabled={loading || !web3.account}
                  />
                  <button 
                    onClick={() => contribute(c.id)} 
                    disabled={loading || !web3.account || !contributeAmount}
                  >
                    {loading ? <span className="loading"></span> : `Contribute ${contributeAmount} ETH`}
                  </button>
                </div>
              )}

              {Number(c.status) === 1 && web3.account?.toLowerCase() === c.creator.toLowerCase() && (
                <button 
                  onClick={() => withdraw(c.id)} 
                  disabled={loading}
                >
                  {loading ? <span className="loading"></span> : 'Withdraw Funds'}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
