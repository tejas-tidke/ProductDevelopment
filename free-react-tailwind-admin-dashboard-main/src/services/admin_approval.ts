export type ApprovalInput = {
  ticketId: string;
  title: string;
  requester?: string;
};

export type ApprovalResult = {
  approved: boolean;
  note?: string;
};

// Simulate admin approval with a small delay
export async function approveRequest(input: ApprovalInput): Promise<ApprovalResult> {
  // You could plug this into a backend later; for now simulate success
  await new Promise((res) => setTimeout(res, 600));
  return { approved: true, note: `Ticket ${input.ticketId} approved by admin bot` };
}
