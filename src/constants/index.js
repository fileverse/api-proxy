const TALLY_QUERY = `query Organization($input: OrganizationInput!) {
  organization(input: $input) {
    id
    chainIds
    tokenIds
    governorIds
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
    metadata {
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
        start {
          ... on Block {
            timestamp
          }
        }
        end {
          ... on Block {
            timestamp
          }
        }
        metadata {
          title
          description
        }
      }
    }
  }
}
`





module.exports = {
    TALLY_QUERY,
    TALLY_PROPOSAL_QUERY
}