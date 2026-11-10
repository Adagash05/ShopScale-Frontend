import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import {
  Empty,
  ErrorBox,
  Field,
  ListSkeleton,
  Modal,
  useDebounced,
  useLoad,
  useToast,
} from "../../components.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { BranchSelect, useBranch } from "../../lib/branch.jsx";
import { dateOnly, money, qtyText } from "../../lib/format.js";

const STATUS = {
  OPEN: ["Open", "blue"],
  ACCEPTED: ["Accepted", "teal"],
  EXPIRED: ["Expired", "gray"],
  CONVERTED: ["Sold", "teal"],
  CANCELLED: ["Cancelled", "gray"],
  REJECTED: ["Rejected", "gray"],
};
const METHOD = { CASH: "Cash", TRANSFER: "Bank transfer", CARD: "Card" };

function NewDoc({ kind, onClose, onSaved }) {
  const toast = useToast();
  const { can } = useAuth();
  const branch = useBranch();
  const order = kind === "ORDER";
  const [cq, setCq] = useState("");
  const dcq = useDebounced(cq);
  const customers = useLoad(
    () => api.get("/customers", { q: dcq, size: 10 }),
    [dcq],
  );
  const [customer, setCustomer] = useState(null);
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const found = useLoad(
    () =>
      api.get("/products/sellable", {
        q: dq,
        branchId: branch.branchId || undefined,
      }),
    [dq, branch.branchId],
  );
  const [lines, setLines] = useState([]);
  const [discount, setDiscount] = useState("");
  const [deposit, setDeposit] = useState("");
  const [depositMethod, setDepositMethod] = useState("CASH");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
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
              price: it.price,
              quantity: "1",
              allowDecimal: it.allowDecimal,
            },
          ],
    );
  const subtotal = lines.reduce(
    (s, l) => s + Number(l.price) * (Number(l.quantity) || 0),
    0,
  );
  const total = Math.max(0, subtotal - (Number(discount) || 0));

  async function save() {
    if (order && !customer) {
      setErr("Choose the customer this order is for");
      return;
    }
    if (lines.length === 0) {
      setErr("Add at least one item");
      return;
    }
    for (const l of lines)
      if (
        !(Number(l.quantity) > 0) ||
        (!l.allowDecimal && !Number.isInteger(Number(l.quantity)))
      ) {
        setErr(`Check the quantity of ${l.name}`);
        return;
      }
    setBusy(true);
    setErr("");
    try {
      await api.post("/sales-documents", {
        kind,
        customerId: customer?.id || null,
        branchId: branch.branchId,
        discount: discount === "" ? 0 : Number(discount),
        depositAmount: order && deposit !== "" ? Number(deposit) : 0,
        depositMethod: order && deposit !== "" ? depositMethod : null,
        validUntil: !order && date ? date : null,
        deliveryDate: order && date ? date : null,
        note: note || null,
        items: lines.map((l) => ({
          variantId: l.variantId,
          quantity: Number(l.quantity),
        })),
      });
      toast(order ? "Order saved" : "Quotation saved");
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={order ? "New customer order" : "New quotation"}
      onClose={onClose}
    >
      {customer ? (
        <div className="row between">
          <strong>{customer.name}</strong>
          <button className="btn sm" onClick={() => setCustomer(null)}>
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            className="input"
            placeholder={
              order ? "Find the customer" : "Find the customer (optional)"
            }
            aria-label="Search customers"
            value={cq}
            onChange={(e) => setCq(e.target.value)}
          />
          <div className="list" style={{ maxHeight: 110, overflowY: "auto" }}>
            {customers.data?.content.map((c) => (
              <button
                key={c.id}
                className="list-item"
                onClick={() => setCustomer(c)}
              >
                <div className="grow title">{c.name}</div>
              </button>
            ))}
          </div>
        </>
      )}
      <BranchSelect branch={branch} label="Stock comes from" id="doc-branch" />
      <input
        className="input"
        placeholder="Search product to add"
        aria-label="Search products"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <div
        className="section list"
        style={{ maxHeight: 130, overflowY: "auto" }}
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
              <div className="meta">{money(it.price)}</div>
            </div>
            <Plus size={18} />
          </button>
        ))}
      </div>
      {lines.map((l) => (
        <div className="row" key={l.variantId}>
          <div className="grow">
            <div className="title">{l.name}</div>
            <div className="meta">{money(l.price)} each</div>
          </div>
          <input
            className="input"
            style={{ width: 80 }}
            aria-label={`Quantity of ${l.name}`}
            type="number"
            inputMode="decimal"
            min="0"
            step={l.allowDecimal ? "0.001" : "1"}
            value={l.quantity}
            onChange={(e) =>
              setLines((ls) =>
                ls.map((x) =>
                  x.variantId === l.variantId
                    ? { ...x, quantity: e.target.value }
                    : x,
                ),
              )
            }
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
      {can("SALES_DISCOUNT") && (
        <Field label="Discount (₦)" htmlFor="doc-disc">
          <input
            id="doc-disc"
            className="input"
            type="number"
            inputMode="decimal"
            min="0"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </Field>
      )}
      <div className="kv">
        <strong>Total</strong>
        <strong className="num">{money(total)}</strong>
      </div>
      {order && (
        <>
          <Field label="Deposit received now (₦)" htmlFor="doc-dep">
            <input
              id="doc-dep"
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              value={deposit}
              onChange={(e) => setDeposit(e.target.value)}
            />
          </Field>
          {deposit !== "" && Number(deposit) > 0 && (
            <div className="seg" role="group" aria-label="Deposit paid with">
              {Object.entries(METHOD).map(([id, label]) => (
                <button
                  key={id}
                  className={`chip ${depositMethod === id ? "on" : ""}`}
                  aria-pressed={depositMethod === id}
                  onClick={() => setDepositMethod(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <Field
        label={order ? "Delivery or pickup date" : "Valid until"}
        htmlFor="doc-date"
      >
        <input
          id="doc-date"
          className="input"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </Field>
      <Field label="Note (optional)" htmlFor="doc-note" error={err}>
        <input
          id="doc-note"
          className="input"
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </Field>
      <button className="btn primary block" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Save"}
      </button>
    </Modal>
  );
}

function Convert({ doc, onClose, onSaved }) {
  const toast = useToast();
  const balance = Number(doc.total) - Number(doc.depositAmount);
  const [method, setMethod] = useState("CASH");
  const [paid, setPaid] = useState(String(Math.max(0, balance)));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    const amt = Number(paid) || 0;
    if (amt < 0 || amt > balance) {
      setErr("That is more than the balance due");
      return;
    }
    if (amt < balance && !doc.customerId) {
      setErr("Choose a customer on the document to leave a balance owing");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      await api.post(`/sales-documents/${doc.id}/convert`, {
        payments: amt > 0 ? [{ method, amount: amt }] : [],
        clientRequestId: `doc-${doc.id}`,
      });
      toast("Sale recorded");
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`Make this a sale · #${doc.number}`} onClose={onClose}>
      <div className="kv">
        <span className="k">Total</span>
        <span className="num">{money(doc.total)}</span>
      </div>
      {Number(doc.depositAmount) > 0 && (
        <div className="kv">
          <span className="k">Deposit already received</span>
          <span className="num">{money(doc.depositAmount)}</span>
        </div>
      )}
      <div className="kv">
        <strong>Balance due</strong>
        <strong className="num">{money(balance)}</strong>
      </div>
      <div className="seg" role="group" aria-label="Paid with">
        {Object.entries(METHOD).map(([id, label]) => (
          <button
            key={id}
            className={`chip ${method === id ? "on" : ""}`}
            aria-pressed={method === id}
            onClick={() => setMethod(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <Field
        label="Paid now (₦)"
        htmlFor="cv-paid"
        hint="Anything left unpaid is added to what the customer owes"
        error={err}
      >
        <input
          id="cv-paid"
          className="input"
          type="number"
          inputMode="decimal"
          min="0"
          value={paid}
          onChange={(e) => setPaid(e.target.value)}
        />
      </Field>
      <button className="btn primary block" disabled={busy} onClick={save}>
        {busy ? "Saving…" : "Record sale"}
      </button>
    </Modal>
  );
}

export function Documents({ kind }) {
  const { can } = useAuth();
  const toast = useToast();
  const order = kind === "ORDER";
  const list = useLoad(
    () => api.get("/sales-documents", { kind, size: 50 }),
    [kind],
  );
  const [creating, setCreating] = useState(false);
  const [converting, setConverting] = useState(null);
  async function act(d, what, q = "") {
    try {
      await api.post(`/sales-documents/${d.id}/${what}${q}`);
      toast("Done");
      list.reload();
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <h1>{order ? "Customer orders" : "Quotations"}</h1>
          <p className="sub">
            {order
              ? "Orders taken now and delivered later"
              : "Prices you have given to customers"}
          </p>
        </div>
        {can("QUOTES_MANAGE") && (
          <button className="btn primary" onClick={() => setCreating(true)}>
            <Plus size={18} /> {order ? "New order" : "New quotation"}
          </button>
        )}
      </div>
      <ErrorBox error={list.error} onRetry={list.reload} />
      {list.loading && <ListSkeleton />}
      {list.data?.content.length === 0 && (
        <div className="section">
          <Empty title={order ? "No orders yet" : "No quotations yet"} />
        </div>
      )}
      <div className="stack-sm">
        {list.data?.content.map((d) => {
          const [label, tone] = STATUS[d.status] || [d.status, "gray"];
          const live = d.status === "OPEN" || d.status === "ACCEPTED";
          return (
            <div className="section pad stack-sm" key={d.id}>
              <div className="row between">
                <strong>
                  #{d.number} · {d.customerName || "No customer"}
                </strong>
                <span className={`badge ${tone}`}>{label}</span>
              </div>
              <div className="meta">
                {dateOnly(d.createdAt)} · {money(d.total)}
                {Number(d.depositAmount) > 0
                  ? ` · deposit ${money(d.depositAmount)}`
                  : ""}
                {d.validUntil ? ` · valid until ${dateOnly(d.validUntil)}` : ""}
                {d.deliveryDate ? ` · for ${dateOnly(d.deliveryDate)}` : ""}
              </div>
              {d.items.map((i, k) => (
                <div className="kv" key={k}>
                  <span className="k">
                    {i.productName}
                    {i.variantLabel ? ` (${i.variantLabel})` : ""}
                  </span>
                  <span className="num">
                    {qtyText(i.quantity)} × {money(i.unitPrice)}
                  </span>
                </div>
              ))}
              {live && can("QUOTES_MANAGE") && (
                <div className="row">
                  {!order && d.status === "OPEN" && (
                    <button className="btn" onClick={() => act(d, "accept")}>
                      Customer accepted
                    </button>
                  )}
                  {can("SALES_CREATE") && (
                    <button
                      className="btn primary"
                      onClick={() => setConverting(d)}
                    >
                      {order ? "Deliver and record sale" : "Make this a sale"}
                    </button>
                  )}
                  <button
                    className="btn"
                    onClick={() =>
                      act(
                        d,
                        "cancel",
                        Number(d.depositAmount) > 0
                          ? "?refundDeposit=true"
                          : "",
                      )
                    }
                  >
                    {Number(d.depositAmount) > 0
                      ? "Cancel and return deposit"
                      : "Cancel"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {creating && (
        <NewDoc
          kind={kind}
          onClose={() => setCreating(false)}
          onSaved={list.reload}
        />
      )}
      {converting && (
        <Convert
          doc={converting}
          onClose={() => setConverting(null)}
          onSaved={list.reload}
        />
      )}
    </div>
  );
}
export const Quotes = () => <Documents kind="QUOTE" />;
export const Orders = () => <Documents kind="ORDER" />;
