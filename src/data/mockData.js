// Initial Mock Data for TrustChain Platform

export const INITIAL_USERS = [
  {
    walletAddress: "0xAbc1234567890123456789012345678901234567",
    name: "Alice Vance (Buyer / Client)",
    role: "buyer",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    reputationScore: 94,
    completedTransactions: 19,
    disputesLost: 0,
    disputesWon: 2,
    averageRating: 4.9,
    joinedDate: "Jan 2026",
    bio: "Web3 Founder & Active Angel Deployer. Reliable payments, clear milestone specifications, zero defaults.",
    ratings: [
      {
        from: "0xDef4567890123456789012345678901234567890",
        fromName: "Bob the Builder",
        stars: 5,
        comment: "Flawless client! Released escrow payment immediately after test suite passed.",
        date: "2026-08-26",
        txId: "txn_003"
      },
      {
        from: "0x555Carol12345678901234567890123456789012",
        fromName: "Carol Design Studio",
        stars: 5,
        comment: "Extremely professional, clear technical specs and instant settlement confirmation.",
        date: "2026-08-12",
        txId: "txn_008"
      }
    ]
  },
  {
    walletAddress: "0xDef4567890123456789012345678901234567890",
    name: "Bob the Builder (Seller / Provider)",
    role: "seller",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    reputationScore: 88,
    completedTransactions: 26,
    disputesLost: 1,
    disputesWon: 3,
    averageRating: 4.75,
    joinedDate: "Nov 2025",
    bio: "Senior Solidity Architect & Full-Stack Web3 Engineer. Over 25+ successful escrows completed on-chain.",
    ratings: [
      {
        from: "0xAbc1234567890123456789012345678901234567",
        fromName: "Alice Vance",
        stars: 5,
        comment: "Outstanding smart contract audit. Found 2 reentrancy vectors and provided instant unit test fixes.",
        date: "2026-08-26",
        txId: "txn_003"
      },
      {
        from: "0x999Dave123456789012345678901234567890123",
        fromName: "Dave Cloud Infra",
        stars: 4.5,
        comment: "Great engineer, delivered on schedule with comprehensive deployment scripts.",
        date: "2026-07-29",
        txId: "txn_009"
      }
    ]
  },
  {
    walletAddress: "0x789Eth4567890123456789012345678901234567",
    name: "TrustChain Council (Arbiter / Mediator)",
    role: "arbiter",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
    reputationScore: 99,
    completedTransactions: 92,
    disputesLost: 0,
    disputesWon: 0,
    averageRating: 5.0,
    joinedDate: "Aug 2025",
    bio: "Official decentralized mediation panel elected by community staking. Impartial evidentiary evaluation.",
    ratings: [
      {
        from: "0x333Elena12345678901234567890123456789012",
        fromName: "Elena Security Labs",
        stars: 5,
        comment: "Fair and objective dispute resolution according to code-verified logs.",
        date: "2026-08-05",
        txId: "txn_010"
      }
    ]
  },
  {
    walletAddress: "0x555Carol12345678901234567890123456789012",
    name: "Carol Studio (UI/UX Provider)",
    role: "seller",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    reputationScore: 91,
    completedTransactions: 15,
    disputesLost: 0,
    disputesWon: 1,
    averageRating: 4.85,
    joinedDate: "Dec 2025",
    bio: "Web3 design specialist: Figma design systems, DeFi dashboards, NFT 3D assets.",
    ratings: []
  },
  {
    walletAddress: "0x999Dave123456789012345678901234567890123",
    name: "Dave Infrastructure",
    role: "seller",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    reputationScore: 74,
    completedTransactions: 8,
    disputesLost: 1,
    disputesWon: 1,
    averageRating: 4.2,
    joinedDate: "Feb 2026",
    bio: "Node infrastructure & RPC cluster engineer. Validating for Polygon, Arbitrum & Base.",
    ratings: []
  },
  {
    walletAddress: "0x333Elena12345678901234567890123456789012",
    name: "Elena Security Labs",
    role: "seller",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    reputationScore: 97,
    completedTransactions: 33,
    disputesLost: 0,
    disputesWon: 4,
    averageRating: 4.95,
    joinedDate: "Oct 2025",
    bio: "Formal verification and zero-knowledge circuit security auditor.",
    ratings: []
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    id: "txn_001",
    buyer: "0xAbc1234567890123456789012345678901234567",
    seller: "0xDef4567890123456789012345678901234567890",
    amount: "1.5",
    currency: "MATIC",
    description: "Full-Stack dApp Smart Contract Audit & Gas Optimization",
    deliveryTerms: "Provide comprehensive PDF audit report, automated Foundry tests, and pull request fixes within 5 days.",
    status: "In Progress", // Created | In Progress | Delivered | Completed | Disputed | Refunded
    createdAt: "2026-09-01 10:30",
    inspectionPeriodDays: 3,
    txHash: "0x8f3b2a194c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f",
    history: [
      { status: "Created", date: "2026-09-01 10:30", note: "Escrow initialized by buyer" },
      { status: "In Progress", date: "2026-09-01 10:35", note: "1.5 MATIC locked into TrustChain Escrow vault" }
    ],
    evidence: {
      buyer: [],
      seller: []
    }
  },
  {
    id: "txn_002",
    buyer: "0xAbc1234567890123456789012345678901234567",
    seller: "0xDef4567890123456789012345678901234567890",
    amount: "0.8",
    currency: "MATIC",
    description: "Responsive Figma Design System for DeFi Lending Protocol",
    deliveryTerms: "Complete Figma link with auto-layout components, dark/light modes, and interactive prototype.",
    status: "Delivered",
    createdAt: "2026-09-03 14:15",
    inspectionPeriodDays: 2,
    txHash: "0x7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b",
    history: [
      { status: "Created", date: "2026-09-03 14:15", note: "Escrow order placed" },
      { status: "In Progress", date: "2026-09-03 14:20", note: "Funds locked into vault" },
      { status: "Delivered", date: "2026-09-05 18:40", note: "Seller submitted deliverables via Figma URL and IPFS package" }
    ],
    deliveryProof: "Figma workspace link: figma.com/@defi-system (IPFS CID: QmZtmD2QT6fJ7p8kX2bV3qW4...)",
    evidence: {
      buyer: [],
      seller: []
    }
  },
  {
    id: "txn_003",
    buyer: "0xAbc1234567890123456789012345678901234567",
    seller: "0xDef4567890123456789012345678901234567890",
    amount: "2.4",
    currency: "ETH",
    description: "ZK-Rollup Gas Optimization Review & Benchmark Suite",
    deliveryTerms: "30% reduction in gas consumption on state updates validated on Sepolia testnet.",
    status: "Completed",
    createdAt: "2026-08-25 09:00",
    inspectionPeriodDays: 4,
    txHash: "0x1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d",
    history: [
      { status: "Created", date: "2026-08-25 09:00", note: "Escrow agreement formed" },
      { status: "In Progress", date: "2026-08-25 09:12", note: "2.4 ETH locked in escrow" },
      { status: "Delivered", date: "2026-08-26 15:30", note: "Code PR #42 merged and verified" },
      { status: "Completed", date: "2026-08-26 17:00", note: "Buyer confirmed satisfaction. 2.4 ETH disbursed to seller. On-chain reputation incremented (+4 pts)." }
    ],
    ratingGiven: 5,
    ratingComment: "Outstanding smart contract audit. Found 2 reentrancy vectors and provided instant unit test fixes.",
    evidence: {
      buyer: [],
      seller: []
    }
  },
  {
    id: "txn_004",
    buyer: "0xAbc1234567890123456789012345678901234567",
    seller: "0xDef4567890123456789012345678901234567890",
    amount: "3.2",
    currency: "MATIC",
    description: "Hardware Validator Node Setup & Automated Failover Configuration",
    deliveryTerms: "Bare metal Linux server provisioned with 99.9% uptime SLA script and Discord alert bot.",
    status: "Disputed",
    createdAt: "2026-09-02 11:20",
    inspectionPeriodDays: 3,
    txHash: "0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f",
    history: [
      { status: "Created", date: "2026-09-02 11:20", note: "Escrow initialized" },
      { status: "In Progress", date: "2026-09-02 11:25", note: "3.2 MATIC locked in contract" },
      { status: "Delivered", date: "2026-09-04 16:00", note: "Seller marked server deployed" },
      { status: "Disputed", date: "2026-09-05 09:10", note: "Buyer opened dispute: Server crashed twice in 12 hours, Discord bot not functioning." }
    ],
    disputeReason: "Validator node crashed within 12 hours of delivery. The automated failover daemon was missing.",
    evidence: {
      buyer: [
        {
          author: "0xAbc1234567890123456789012345678901234567",
          timestamp: "2026-09-05 09:30",
          text: "Attached server syslog showing kernel panic at 03:14 UTC. The failover watchdog daemon specified in agreement Section 3 was never installed.",
          attachmentName: "syslog-crash-report.txt"
        }
      ],
      seller: [
        {
          author: "0xDef4567890123456789012345678901234567890",
          timestamp: "2026-09-05 13:45",
          text: "The crash was caused by buyer running unauthorized heavy Docker containers on the same box which exhausted memory. Watchdog script is located at /opt/trustchain/watchdog.sh.",
          attachmentName: "install-log.txt"
        }
      ]
    }
  },
  {
    id: "txn_005",
    buyer: "0xAbc1234567890123456789012345678901234567",
    seller: "0x555Carol12345678901234567890123456789012",
    amount: "0.5",
    currency: "MATIC",
    description: "Brand Identity & 3D Web3 Asset Pack (Vector Source Files)",
    deliveryTerms: "10 high-poly 3D icons formatted in GLTF and Blender files with commercial license.",
    status: "Refunded",
    createdAt: "2026-08-18 13:00",
    inspectionPeriodDays: 2,
    txHash: "0x3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c",
    history: [
      { status: "Created", date: "2026-08-18 13:00", note: "Escrow formed" },
      { status: "In Progress", date: "2026-08-18 13:05", note: "0.5 MATIC locked" },
      { status: "Disputed", date: "2026-08-20 10:00", note: "Mutual cancellation agreed due to scope shift" },
      { status: "Refunded", date: "2026-08-20 14:00", note: "Escrow contract returned 0.5 MATIC to buyer" }
    ],
    evidence: {
      buyer: [],
      seller: []
    }
  },
  {
    id: "txn_006",
    buyer: "0xAbc1234567890123456789012345678901234567",
    seller: "0x999Dave123456789012345678901234567890123",
    amount: "0.4",
    currency: "ETH",
    description: "ENS Domain Name Escrow Transfer (trustchain.eth)",
    deliveryTerms: "ENS name ownership transfer to buyer address with controller privileges verified on Etherscan.",
    status: "Created",
    createdAt: "2026-09-06 18:00",
    inspectionPeriodDays: 1,
    txHash: "0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
    history: [
      { status: "Created", date: "2026-09-06 18:00", note: "Escrow order created, awaiting deposit confirmation" }
    ],
    evidence: {
      buyer: [],
      seller: []
    }
  }
];
