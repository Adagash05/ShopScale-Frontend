import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import {
  Empty,
  ErrorBox,
  Field,
  ListSkeleton,
  Modal,
  useDebounced,
  useLoad,
  useToast,
} from "../components.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { BranchSelect, useBranch } from "../lib/branch.jsx";
import { dateTime, money, qtyText } from "../lib/format.js";
import { newRequestId } from "../lib/cart.js";

const STATUS = {
  ORDERED: ["Ordered", "blue"],
  PARTIALLY_RECEIVED: ["Part delivered", "warn"],
  RECEIVED: ["Received", "teal"],
  CANCELLED: ["Cancelled", "gray"],
  CLOSED: ["Closed short", "gray"],
};

function NewOrder({ onClose, onSaved }) {
  const toast = useToast();
  const branch = useBranch();
  const suppliers = useLoad(() => api.get("/suppliers", { size: 100 }), []);
  const [supplierId, setSupplierId] = useState("");
  const [expected, setExpected] = useState("");
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const found = useLoad(() => api.get("/products/sellable", { q: dq }), [dq]);
  const [lines, setLines] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const add = (it) =>
    setLines((ls) =>
      ls.some((l) => l.variantId === it.variantId)
        ? ls
        : [
            ...ls,
            {
              variantId: it.variantId,
              name: it.label
                ? `${it.productName} (${it.label})`
                : it.productName,
              quantity: "",
              unitCost: "",
              allowDecimal: it.allowDecimal,
              unit: it.unit,
            },
          ],
    );
  const set = (id, patch) =>
    setLines((ls) =>
      ls.map((l) => (l.variantId === id ? { ...l, ...patch } : l)),
    );

  async function save() {
    if (!supplierId) {
      setErr("Choose a supplier");
      return;
    }
    if (lines.length === 0) {
      setErr("Add at least one product");
      return;
    }
    for (const l of lines) {
      const n = Number(l.quantity);
      if (!(n > 0) || (!l.allowDecimal && !Number.isInteger(n))) {
        setErr(`Enter how many ${l.name} you are ordering`);
        return;
      }
      if (l.unitCost === "" || Number(l.unitCost) < 0) {
        setErr(`Enter the price for ${l.name}`);
        return;
      }
    }
    setBusy(true);
    setErr("");
    try {
      await api.post("/purchase-orders", {
        supplierId,
        branchId: branch.branchId,
        expectedDate: expected || null,
        note: note || null,
        items: lines.map((l) => ({
          variantId: l.variantId,
          quantity: Number(l.quantity),
          unitCost: Number(l.unitCost),
        })),
      });
      toast("Order saved");
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New order to a supplier" onClose={onClose}>
      <Field label="Supplier" htmlFor="po-sup">
        <select
          id="po-sup"
          className="input"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <option value="">Choose…</option>
          {suppliers.data?.content?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>
      <BranchSelect branch={branch} label="Deliver to" id="po-branch" />
      <Field label="Expected on (optional)" htmlFor="po-exp">
        <input
          id="po-exp"
          className="input"
          type="date"
          value={expected}
          onChange={(e) => setExpected(e.target.value)}
        />
      </Field>
      <input
        className="input"
        placeholder="Search product to add"
        aria-label="Search products"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div
        className="section list"
        style={{ maxHeight: 150, overflowY: "auto" }}
      >
        {found.data?.map((it) => (
          <button
            key={it.variantId}
            className="list-item"
            onClick={() => add(it)}
          >
            <div className="grow">
              <div className="title">
                {it.label ? `${it.productName} (${it.label})` : it.productName}
              </div>
            </div>
            <Plus size={18} />
          </button>
        ))}
      </div>
      {lines.map((l) => (
        <div className="row" key={l.variantId}>
          <div className="grow title">{l.name}</div>
          <input
            className="input"
            style={{ width: 80 }}
            aria-label={`Quantity of ${l.name}`}
            placeholder="Qty"
            type="number"
            inputMode="decimal"
            min="0"
            step={l.allowDecimal ? "0.001" : "1"}
            value={l.quantity}
            onChange={(e) => set(l.variantId, { quantity: e.target.value })}
          />
          <input
            className="input"
            style={{ width: 96 }}
            aria-label={`Price of ${l.name}`}
            placeholder="Price ₦"
            type="number"
            inputMode="decimal"
            min="0"
            value={l.unitCost}
            onChange={(e) => set(l.variantId, { unitCost: e.target.value })}
          />
          <button
            className="icon-btn"
            aria-label={`Remove ${l.name}`}
            onClick={() =>
              setLines((ls) => ls.filter((x) => x.variantId !== l.variantId))
            }
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
      <Field label="Note (optional)" htmlFor="po-note" error={err}>
        <input
          id="po-note"
          className="input"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <button className="btn primary block" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save order"}
      </button>
    </Modal>
  );
}

function Receive({ order, onClose, onSaved }) {
  const toast = useToast();
  const [qty, setQty] = useState({});
  const [paid, setPaid] = useState("");
  const [invoice, setInvoice] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [requestId] = useState(newRequestId);
  const open = order.items.filter(
    (i) => Number(i.quantityOrdered) > Number(i.quantityReceived),
  );

  async function save() {
    const lines = [];
    for (const i of open) {
      const raw = qty[i.id];
      if (raw === undefined || raw === "") continue;
      const n = Number(raw);
      const left = Number(i.quantityOrdered) - Number(i.quantityReceived);
      if (!(n > 0)) {
        setErr("Quantities must be above zero");
        return;
      }
      if (n > left) {
        setErr(`Only ${qtyText(left)} of ${i.productName} is still expected`);
        return;
      }
      lines.push({ orderItemId: i.id, quantity: n });
    }
    if (lines.length === 0) {
      setErr("Enter how much of each product arrived");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await api.post(`/purchase-orders/${order.id}/receive`, {
        lines,
        amountPaid: paid === "" ? 0 : Number(paid),
        supplierInvoice: invoice || null,
        clientRequestId: requestId,
      });
      toast("Goods received. Stock updated.");
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`Receive goods · Order #${order.poNumber}`} onClose={onClose}>
      <p className="muted">
        Enter only what has arrived. You can receive the rest later.
      </p>
      {open.map((i) => (
        <div className="row" key={i.id}>
          <div className="grow">
            <div className="title">
              {i.productName}
              {i.variantLabel ? ` (${i.variantLabel})` : ""}
            </div>
            <div className="meta">
              Ordered {qtyText(i.quantityOrdered)} · received{" "}
              {qtyText(i.quantityReceived)} · {money(i.unitCost)} each
            </div>
          </div>
          <input
            className="input"
            style={{ width: 90 }}
            aria-label={`Received ${i.productName}`}
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={qty[i.id] ?? ""}
            onChange={(e) => setQty({ ...qty, [i.id]: e.target.value })}
          />
        </div>
      ))}
      <Field label="Supplier invoice number (optional)" htmlFor="rc-inv">
        <input
          id="rc-inv"
          className="input"
          value={invoice}
          maxLength={60}
          onChange={(e) => setInvoice(e.target.value)}
        />
      </Field>
      <Field
        label="Paid to the supplier now (₦)"
        htmlFor="rc-paid"
        hint="Anything you do not pay now is added to what you owe this supplier"
        error={err}
      >
        <input
          id="rc-paid"
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
        />
      </Field>
      <button className="btn primary block" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Confirm delivery"}
      </button>
    </Modal>
  );
}

export default function Purchases() {
  const { can } = useAuth();
  const toast = useToast();
  const list = useLoad(() => api.get("/purchase-orders", { size: 50 }), []);
  const [creating, setCreating] = useState(false);
  const [receiving, setReceiving] = useState(null);
  async function cancel(o) {
    try {
      await api.post(`/purchase-orders/${o.id}/cancel`);
      toast(o.status === "ORDERED" ? "Order cancelled" : "Order closed");
      list.reload();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>Orders to suppliers</h1>
          <p className="sub">
            Order stock, then receive it in one or more deliveries
          </p>
        </div>
        {can("PURCHASES_CREATE") && (
          <button className="btn primary" onClick={() => setCreating(true)}>
            <Plus size={18} /> New order
          </button>
        )}
      </div>
      <div className="row">
        <Link className="btn" to="/purchases/new">
          Record stock bought without an order
        </Link>
        <Link className="btn" to="/suppliers">
          Suppliers
        </Link>
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data && list.data.content.length === 0 && (
        <div className="section">
          <Empty title="No orders yet">
            Create an order when you buy from a supplier.
          </Empty>
        </div>
      )}
      <div className="stack-sm">
        {list.data?.content.map((o) => {
          const [label, tone] = STATUS[o.status] || [o.status, "gray"];
          return (
            <div className="section pad stack-sm" key={o.id}>
              <div className="row between">
                <strong>
                  #{o.poNumber} · {o.supplierName}
                </strong>
                <span className={`badge ${tone}`}>{label}</span>
              </div>
              <div className="meta">
                {dateTime(o.createdAt)}
                {o.expectedDate ? ` · expected ${o.expectedDate}` : ""} ·{" "}
                {money(o.total)}
              </div>
              {o.items.map((i) => (
                <div className="kv" key={i.id}>
                  <span className="k">
                    {i.productName}
                    {i.variantLabel ? ` (${i.variantLabel})` : ""}
                  </span>
                  <span className="num">
                    {qtyText(i.quantityReceived)} / {qtyText(i.quantityOrdered)}
                  </span>
                </div>
              ))}
              {can("PURCHASES_CREATE") &&
                (o.status === "ORDERED" ||
                  o.status === "PARTIALLY_RECEIVED") && (
                  <div className="row">
                    <button
                      className="btn primary"
                      onClick={() => setReceiving(o)}
                    >
                      Receive goods
                    </button>
                    <button className="btn" onClick={() => cancel(o)}>
                      {o.status === "ORDERED" ? "Cancel order" : "Close order"}
                    </button>
                  </div>
                )}
            </div>
          );
        })}
      </div>
      {creating && (
        <NewOrder onClose={() => setCreating(false)} onSaved={list.reload} />
      )}
      {receiving && (
        <Receive
          order={receiving}
          onClose={() => setReceiving(null)}
          onSaved={list.reload}
        />
      )}
    </div>
  );
}
