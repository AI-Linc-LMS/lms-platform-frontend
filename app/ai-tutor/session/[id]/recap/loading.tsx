import PageShimmerLayout from "@/components/common/PageShimmerLayout";

// The recap is a document, so the detail variant matches its shape: a hero, then stacked
// sections. Renders instantly on the transition out of the room, which is the moment a learner
// is most likely to notice a blank frame because they just ended a call.
export default function Loading() {
  return <PageShimmerLayout variant="detail" />;
}
