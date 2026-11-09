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
        <Link to="/" aria-label="CrowdFund home">
          <span className="logo-mark" aria-hidden="true" />
          CROWDFUND
        </Link>
      </div>
      <nav className="main-nav">
        <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
          Campaigns
        </Link>
        {isAdmin && (
          <Link to="/admin" className={location.pathname === '/admin' ? 'active' : ''}>
            Admin
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
      refreshCampaigns()
      try {
        const w = await getWallet()
        setWeb3(w)
        if (w.account) {
          await refreshVerificationStatus()
        }
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

  const getStatusText = (status: number) => {
    switch (status) {
      case 0: return 'Active'
      case 1: return 'Completed'
      case 2: return 'Withdrawn'
      default: return 'Unknown'
    }
  }

  const chainName = (id?: number) =>
    id === 11155111 ? 'Sepolia' : id === 31337 ? 'Hardhat Local' : id ? `Chain ${id}` : 'Unknown'

  return (
    <main className="app-container">
      <section className="hero">
        <div className="eyebrow">// On-chain · KYC-gated · Trustless</div>
        <h1>Fund the future, <span>block by block.</span></h1>
        <p>Launch and back campaigns directly on Ethereum. Every contribution is recorded on-chain and released only when the goal is met.</p>
      </section>

      <div className="wallet-info">
        <div className="readout">
          <div className="readout-label">Wallet</div>
          <div className="readout-value">
            <span className={`dot ${web3.account ? 'on' : ''}`} />
            {web3.account ? `${web3.account.slice(0, 6)}…${web3.account.slice(-4)}` : 'Not connected'}
          </div>
        </div>
        <div className="readout">
          <div className="readout-label">Network</div>
          <div className="readout-value">{chainName(web3.chainId)}</div>
        </div>
        <div className="readout">
          <div className="readout-label">Identity</div>
          <div className="readout-value">
            <span className={`dot ${isVerified ? 'on' : 'warn'}`} />
            {isVerified ? 'Verified' : 'Not verified'}
          </div>
        </div>
      </div>

      {error && <div className="error" role="alert">{error}</div>}
      {success && <div className="success" role="status">{success}</div>}

      <div className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">01 / Identity</div>
            <h2>KYC verification</h2>
          </div>
          <button className="ghost" onClick={refreshVerificationStatus} disabled={loading}>
            Refresh status
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

        <p className="section-note">
          {isVerified
            ? 'Your identity is verified. You can launch campaigns below.'
            : 'Submit your details once. An admin approves the request on-chain before you can launch campaigns.'}
        </p>
      </div>

      {isVerified && (
        <div className="section">
          <div className="section-head">
            <div>
              <div className="eyebrow">02 / Launch</div>
              <h2>Create a campaign</h2>
            </div>
          </div>
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
        <div className="section-head">
          <div>
            <div className="eyebrow">{isVerified ? '03' : '02'} / Live</div>
            <h2>Campaigns</h2>
          </div>
          <span className="campaign-id">{campaigns.length} on-chain</span>
        </div>
        {campaigns.length === 0 ? (
          <p className="empty">No campaigns yet. Verify your identity and launch the first one.</p>
        ) : (
          <div className="campaign-grid">
          {campaigns.map((c) => {
            const pct = c.goal > 0n ? Math.min(100, Number((c.raised * 100n) / c.goal)) : 0
            const status = Number(c.status)
            return (
            <article key={c.id} className="campaign-card">
              <div className="campaign-top">
                <div>
                  <div className="campaign-id">#{String(c.id).padStart(3, '0')}</div>
                  <div className="campaign-title">{c.title}</div>
                </div>
                <span className={`status-badge ${['status-active', 'status-completed', 'status-withdrawn'][status] ?? 'status-active'}`}>
                  {getStatusText(status)}
                </span>
              </div>
              <p className="campaign-description">{c.description}</p>
              <div className="progress">
                <div className="progress-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Funding progress">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="progress-meta">
                  <strong>{formatEther(c.raised)} / {formatEther(c.goal)} ETH</strong>
                  <span>{pct}%</span>
                </div>
              </div>
              <div className="campaign-stats">
                <div className="stat">
                  <div className="stat-label">Creator</div>
                  <div className="stat-value">
                    {c.creator.slice(0,6)}…{c.creator.slice(-4)}
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-label">Remaining</div>
                  <div className="stat-value">{c.raised >= c.goal ? '0' : formatEther(BigInt(c.goal) - BigInt(c.raised))} ETH</div>
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
                    {loading ? <span className="loading"></span> : 'Back it'}
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
            </article>
            )
          })}
          </div>
        )}
      </div>
    </main>
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
