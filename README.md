# CrowdFunding DApp

A decentralized crowdfunding platform built on Ethereum, featuring KYC verification, campaign management, and secure fund handling.

## 🌟 Features

- **KYC Verification System**
  - User identity verification
  - Admin approval process
  - Verified status tracking

- **Smart Contract Security**
  - Secure fund management
  - Automated goal tracking
  - Safe withdrawal system

- **Campaign Management**
  - Create and manage campaigns
  - Set funding goals
  - Track contribution progress
  - Automated status updates

- **User-Friendly Interface**
  - Modern React frontend
  - Real-time updates
  - Responsive design
  - MetaMask integration

## 🛠 Technology Stack

- **Blockchain**
  - Ethereum (Hardhat v3)
  - Solidity Smart Contracts
  - viem for Web3 interactions

- **Frontend**
  - React
  - TypeScript
  - Vite
  - React Router DOM

- **Development**
  - Hardhat for local blockchain
  - TypeScript for type safety
  - ESLint for code quality

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shayanop/CrowdFuding-DAPP.git
   cd CrowdFuding-DAPP
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend
   npm install
   cd ..
   ```

3. **Set up local blockchain**
   ```bash
   # Terminal 1: Start local Hardhat node
   npm run node

   # Terminal 2: Deploy contracts
   npm run deploy
   ```

4. **Start the frontend**
   ```bash
   # Terminal 3: Launch frontend
   cd frontend
   npm run dev
   ```

5. **Configure MetaMask**
   - Connect MetaMask to Localhost (Hardhat)
   - Network URL: http://localhost:8545
   - Chain ID: 31337

## 💻 Usage

1. **KYC Verification**
   - Connect your wallet
   - Submit KYC information
   - Wait for admin approval

2. **Creating Campaigns**
   - Must be KYC verified
   - Set campaign title, description, and goal
   - Deploy campaign to blockchain

3. **Contributing**
   - Browse active campaigns
   - Contribute ETH to campaigns
   - Track campaign progress

4. **Managing Funds**
   - Automatic goal tracking
   - Withdraw funds when goal reached
   - Secure fund transfer system

## 🔧 Smart Contract Addresses (Local)

- KYCRegistry: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- Crowdfunding: `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512`

## 👨‍💻 Development

### Testing
```bash
# Run contract tests
npm test

# Run frontend tests
cd frontend
npm test
```

### Deployment
1. Configure network in hardhat.config.ts
2. Set environment variables
3. Run deployment script
```bash
npx hardhat run scripts/deploy.ts --network <network-name>
```

## 🔑 Security

- KYC verification required for campaign creation
- Admin-controlled verification process
- Secure fund management
- Goal-based withdrawal system

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
