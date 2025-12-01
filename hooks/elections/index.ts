// Election management hooks
export {
  useElections,
  useElection,
  useElectionAuditLog,
  useCreateElection,
  useUpdateElection,
  useDeleteElection,
  usePublishElection,
  usePauseElection,
  useResumeElection,
  useCloseElection,
  useCancelElection,
  usePositions,
  useCreatePosition,
  useUpdatePosition,
  useDeletePosition,
  useCandidates,
  useCreateCandidate,
  useUpdateCandidate,
  useDeleteCandidate,
  usePollOptions,
  useCreatePollOption,
  useUpdatePollOption,
  useDeletePollOption,
} from "./use-elections"

// Voting hooks
export { useVoteStatus, useVerifyVoter, useCastVotes } from "./use-voting"

// Analytics hooks
export {
  useElectionResults,
  useFinalizedResults,
  useElectionAnalytics,
  useElectionDemographics,
  useRegionalResults,
  useVotingTrends,
  useTurnoutStats,
  useElectionPredictions,
  useCandidateComparison,
  useElectionsDashboard,
  useActiveElectionsDashboard,
  useFinalizeResults,
  useExportElectionData,
} from "./use-election-analytics"
