
const db = {
    vaultItems: [
        {
            id: "vlt-101",
            title: "Gen-Z DeFi Strategy",
            description: "Automated yields for small wallets.",
            fileHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            ipfsUrl: "ipfs://QmXYZ123",
            txHash: "0xabc123",
            timestamp: Date.now() - 86400000 * 2, // 2 days ago
            verified: true,
            ownerAddress: "0xMockUserAddress" 
        }
    ],
    proposals: [
        {
            id: 1,
            title: "Decentralized Carbon Credit Oracle",
            description: "Connecting IoT sensors directly to Polygon via API3.",
            creator: "0x1234567890abcdef1234567890abcdef12345678",
            totalFunds: "1000000000000000000",
            yesVotes: 15,
            noVotes: 2,
            active: true,
            milestones: [
                { percentage: 30, released: true, approved: true },
                { percentage: 40, released: false, approved: false },
                { percentage: 30, released: false, approved: false }
            ],
            ipfsHash: "QmOracleIPFS",
            targetFunds: "1000000000000000000",
            timestamp: Date.now() - 86400000 * 5,
        },
        {
            id: 2,
            title: "ZK-Proof Identity Verification Layer",
            description: "Privacy-preserving identity protocol using zero-knowledge proofs for DAO governance and on-chain credentials.",
            creator: "0xabcdef1234567890abcdef1234567890abcdef12",
            totalFunds: "1320000000000000000",
            yesVotes: 38,
            noVotes: 6,
            active: true,
            milestones: [
                { percentage: 25, released: true, approved: true },
                { percentage: 35, released: false, approved: false },
                { percentage: 40, released: false, approved: false }
            ],
            ipfsHash: "QmZKProofIPFS",
            targetFunds: "2500000000000000000",
            timestamp: Date.now() - 86400000 * 3,
        },
        {
            id: 3,
            title: "Cross-Chain Liquidity Bridge v2",
            description: "Upgrade existing bridge infrastructure to support 12 new EVM-compatible chains with enhanced security.",
            creator: "0x9876543210abcdef9876543210abcdef98765432",
            totalFunds: "5000000000000000000",
            yesVotes: 74,
            noVotes: 17,
            active: false,
            milestones: [
                { percentage: 33, released: true, approved: true },
                { percentage: 33, released: true, approved: true },
                { percentage: 34, released: false, approved: false }
            ],
            ipfsHash: "QmBridgeIPFS",
            targetFunds: "5000000000000000000",
            timestamp: Date.now() - 86400000 * 12,
        },
        {
            id: 4,
            title: "AI-Powered Patent Analysis Engine",
            description: "Machine learning system for automated prior art search, reducing IP litigation costs for Web3 projects.",
            creator: "0x1111222233334444555566667777888899990000",
            totalFunds: "890000000000000000",
            yesVotes: 29,
            noVotes: 8,
            active: true,
            milestones: [
                { percentage: 50, released: false, approved: false },
                { percentage: 50, released: false, approved: false }
            ],
            ipfsHash: "QmAIPatentIPFS",
            targetFunds: "1500000000000000000",
            timestamp: Date.now() - 86400000 * 1,
        },
        {
            id: 5,
            title: "On-Chain Governance Analytics Dashboard",
            description: "Real-time analytics for DAO proposal lifecycle tracking and voter participation metrics.",
            creator: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
            totalFunds: "310000000000000000",
            yesVotes: 9,
            noVotes: 3,
            active: true,
            milestones: [
                { percentage: 50, released: false, approved: false },
                { percentage: 50, released: false, approved: false }
            ],
            ipfsHash: "QmDashboardIPFS",
            targetFunds: "800000000000000000",
            timestamp: Date.now() - 86400000 * 2,
        }
    ],
    verifications: [
        {
            id: "ver-1",
            hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            matchFound: true,
            originalOwner: "0xMockUserAddress",
            timestamp: Date.now() - 86400000,
            txHash: "0xabc123def456"
        }
    ],
    activities: [
        {
            id: "act-1",
            type: "IDEA_COMMITTED",
            description: "Committed new idea 'Gen-Z DeFi Strategy'",
            walletAddress: "0xMockUserAddress",
            timestamp: Date.now() - 86400000 * 2,
            txHash: "0xabc123"
        },
        {
            id: "act-2",
            type: "PROPOSAL_CREATED",
            description: "Created proposal for Carbon Credit Oracle",
            walletAddress: "0x1234567890abcdef1234567890abcdef12345678",
            timestamp: Date.now() - 86400000 * 5,
            txHash: "0xdef456"
        }
    ],
    tokenBlacklist: new Set(),
};

module.exports = db;
