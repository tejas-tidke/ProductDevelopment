export type DemoRequest = {
  id: string;
  title: string;
  requester: string;
  status: 'open' | 'waiting_approval' | 'approved' | 'rejected';
  note?: string;
  createdAt: string;
};

export type StoreListener = () => void;

class DemoRequestStore {
  private requests = new Map<string, DemoRequest>();
  private listeners = new Set<StoreListener>();

  subscribe(fn: StoreListener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  getAll(): DemoRequest[] {
    return Array.from(this.requests.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }

  get(id: string): DemoRequest | undefined {
    return this.requests.get(id);
  }

  upsert(req: DemoRequest) {
    this.requests.set(req.id, req);
    this.notify();
  }

  createRequest(input: { id: string; title: string; requester: string }) {
    const existing = this.get(input.id);
    const req: DemoRequest = {
      id: input.id,
      title: input.title,
      requester: input.requester,
      status: 'waiting_approval',
      createdAt: new Date().toISOString(),
    };
    // preserve previous note if present
    if (existing?.note) req.note = existing.note;
    this.upsert(req);
  }

  approve(id: string, note?: string) {
    const req = this.get(id);
    if (!req) return;
    req.status = 'approved';
    req.note = note || 'Approved';
    this.upsert({ ...req });
  }

  reject(id: string, note?: string) {
    const req = this.get(id);
    if (!req) return;
    req.status = 'rejected';
    req.note = note || 'Rejected';
    this.upsert({ ...req });
  }
}

export const demoRequestStore = new DemoRequestStore();
