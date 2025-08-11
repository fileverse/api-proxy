const TALLY_QUERY = `query Organization($input: OrganizationInput!) {
  organization(input: $input) {
    id
    slug
    name
    chainIds
    tokenIds
    governorIds
    metadata {
      color
      description
      icon
    }
    creator {
      id
      address
      ens
      twitter
      bio
      picture
      safes
      type
    }
    hasActiveProposals
    proposalsCount
    delegatesCount
    delegatesVotesCount
    tokenOwnersCount
    contracts {
      id
      organization_id
      chain_id
      block_id
      tx_hash
      creator_address
      name
      abi
      type
      is_proxy
      implementation_contract_id
      start_block
      created_at
      updated_at
    }
  }
}`







const TALLY_PROPOSAL_QUERY = `
query Proposals($input: ProposalsInput!) {
  proposals(input: $input) {
    nodes {
      ... on Proposal {
        onchainId
        chainId
        proposer {
          address
        }
        quorum
        status
        voteStats {
          type
          votesCount
          votersCount
          percent
        }
        start {
          ... on Block {
            number
            timestamp
          }
        }
        end {
          ... on Block {
            number
            timestamp
          }
        }
        organization {
          slug
        }
      }
    }
    pageInfo {
      firstCursor
      lastCursor
      count
    }
  }
}
`





module.exports = {
    TALLY_QUERY,
    TALLY_PROPOSAL_QUERY
}