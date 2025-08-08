const TALLY_QUERY = `query Organization($input: OrganizationInput!) {
                  organization(input: $input) {
                    id
                    slug
                    name
                    hasActiveProposals
                    proposalsCount
                    delegatesCount
                    delegatesVotesCount
                    tokenOwnersCount
                  }
                }`






module.exports = {
    TALLY_QUERY
}