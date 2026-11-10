import { BranchSelect, useBranch } from "../lib/branch.jsx";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Search, Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  Empty,
  ErrorBox,
  Field,
  Modal,
  useDebounced,
  useLoad,
  useToast,
} from "../components.jsx";
import {
  addPurchaseLine,
  purchasePayment,
  purchaseTotal,
  validatePurchase,
} from "../lib/purchase.js";
import { newRequestId } from "../lib/cart.js";
import { money } from "../lib/format.js";
import { SupplierForm } from "./Suppliers.jsx";

export default function NewPurchase() {
  const { can } = useAuth();
  const toast = useToast();
  const sub = useLoad(() => api.get("/subscriptions/current"), []);
  const suppliers = useLoad(
    () =>
      can("SUPPLIERS_VIEW")
        ? api.get("/suppliers", { size: 100 })
        : Promise.resolve(null),
    [],
  );
  const [q, setQ] = useState("");
  const dq = useDebounced(q);
  const branch = useBranch();
  const found = useLoad(
    () =>
      api.get("/products/sellable", {
        q: dq,
        branchId: branch.branchId || undefined,
      }),
    [dq, branch.branchId],
  );
  const [lines, setLines] = useState([]);
  const [supplierId, setSupplierId] = useState("");
  const [mode, setMode] = useState("full");
  const [part, setPart] = useState("");
  const [reference, setReference] = useState("");
  const [requestId, setRequestId] = useState(newRequestId);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const [addSupplier, setAddSupplier] = useState(false);

  const total = useMemo(() => purchaseTotal(lines), [lines]);
  const { paid, owed } = useMemo(
    () => purchasePayment(mode, part, total),
    [mode, part, total],
  );
  const canOwe = !sub.data || sub.data.features?.includes("SUPPLIER_BALANCES");
  useEffect(() => {
    setError("");
  }, [lines, mode, supplierId, part]);
  const setLine = (id, patch) =>
    setLines((ls) =>
      ls.map((l) => (l.variantId === id ? { ...l, ...patch } : l)),
    );

  async function save() {
    const problem = validatePurchase({
      lines,
      owed,
      supplier: supplierId,
      canOwe,
    });
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const p = await api.post("/purchases", {
        items: lines.map((l) => ({
          variantId: l.variantId,
          quantity: Number(l.quantity),
          unitCost: Number(l.unitCost),
        })),
        branchId: branch.branchId,
        supplierId: supplierId || null,
        amountPaid: paid,
        reference: reference || null,
        clientRequestId: requestId,
      });
      setDone(p);
      setLines([]);
      setSupplierId("");
      setMode("full");
      setPart("");
      setReference("");
      setRequestId(newRequestId());
    } catch (e) {
      setError(e.message);
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="stack">
        <div className="banner">
          Purchase #{done.purchaseNumber} recorded. Your stock has gone up and
          each item’s cost price was updated.
        </div>
        <section className="section">
          {done.items.map((i, k) => (
            <div className="kv" key={k}>
              <span className="k">
                {i.quantity} ×{" "}
                {i.variantLabel
                  ? `${i.productName} (${i.variantLabel})`
                  : i.productName}
              </span>
              <span className="v num">{money(i.lineTotal)}</span>
            </div>
          ))}
          <div className="kv">
            <span className="k">Total</span>
            <span className="v num">{money(done.total)}</span>
          </div>
          {Number(done.amountOwed) > 0 && (
            <div className="kv">
              <span className="k">You still owe {done.supplierName}</span>
              <span className="v num">{money(done.amountOwed)}</span>
            </div>
          )}
        </section>
        <div className="row">
          <Link to="/suppliers" className="btn grow">
            See purchases
          </Link>
          <button className="btn primary grow" onClick={() => setDone(null)}>
            Receive more stock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="page-head">
        <div className="row">
          <Link to="/suppliers" className="icon-btn" aria-label="Back">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1>Receive stock</h1>
            <p className="sub">
              Record what you bought. Stock and cost update automatically.
            </p>
          </div>
        </div>
      </div>
      <BranchSelect branch={branch} label="Receiving into" />
      {sub.data && !sub.data.writable && (
        <div className="banner danger">
          Your account is read-only, so purchases cannot be recorded.{" "}
          <Link to="/more/plan">See plans</Link>
        </div>
      )}
      <div className="sell-grid">
        <section className="stack-sm">
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 12,
                top: 14,
                color: "var(--muted)",
              }}
              aria-hidden="true"
            />
            <input
              className="input"
              style={{ paddingLeft: 38 }}
              placeholder="Search the product you received"
              aria-label="Search products"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <ErrorBox error={found.error} onRetry={found.reload} />
          <div
            className="section list"
            style={{ maxHeight: 360, overflowY: "auto" }}
          >
            {found.data?.map((it) => (
              <button
                key={it.variantId}
                className="list-item"
                onClick={() => setLines((ls) => addPurchaseLine(ls, it))}
              >
                <div className="grow">
                  <div className="title">
                    {it.label
                      ? `${it.productName} (${it.label})`
                      : it.productName}
                  </div>
                  <div className="meta">{it.quantity} in stock now</div>
                </div>
              </button>
            ))}
            {found.data && found.data.length === 0 && (
              <Empty title="No product found">
                Add the product first under Products, then receive stock for it.
              </Empty>
            )}
          </div>
        </section>

        <section className="stack">
          <div className="section">
            <div className="section-title">
              <h2>Received ({lines.length})</h2>
            </div>
            {lines.length === 0 ? (
              <Empty title="Nothing added yet">Tap a product to add it.</Empty>
            ) : (
              lines.map((l) => (
                <div
                  className="pad stack-sm"
                  key={l.variantId}
                  style={{ borderBottom: "1px solid var(--line)" }}
                >
                  <div className="row between">
                    <strong>{l.name}</strong>
                    <button
                      className="icon-btn"
                      aria-label={`Remove ${l.name}`}
                      onClick={() =>
                        setLines((ls) =>
                          ls.filter((x) => x.variantId !== l.variantId),
                        )
                      }
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="form-grid two">
                    <Field label="How many?" htmlFor={`q-${l.variantId}`}>
                      <input
                        id={`q-${l.variantId}`}
                        className="input"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step={l.allowDecimal ? "0.001" : "1"}
                        value={l.quantity}
                        onChange={(e) =>
                          setLine(l.variantId, { quantity: e.target.value })
                        }
                      />
                    </Field>
                    <Field
                      label="Cost of each (₦)"
                      htmlFor={`c-${l.variantId}`}
                    >
                      <input
                        id={`c-${l.variantId}`}
                        className="input"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={l.unitCost}
                        onChange={(e) =>
                          setLine(l.variantId, { unitCost: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                </div>
              ))
            )}
          </div>
          {lines.length > 0 && (
            <div className="section pad stack">
              <Field label="Supplier" htmlFor="sup">
                <div className="row">
                  <select
                    id="sup"
                    className="select"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                  >
                    <option value="">No supplier</option>
                    {suppliers.data?.content?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {can("SUPPLIERS_MANAGE") && (
                    <button
                      type="button"
                      className="btn"
                      onClick={() => setAddSupplier(true)}
                    >
                      New
                    </button>
                  )}
                </div>
              </Field>
              <Field label="Supplier invoice number (optional)" htmlFor="ref">
                <input
                  id="ref"
                  className="input"
                  value={reference}
                  maxLength={60}
                  onChange={(e) => setReference(e.target.value)}
                />
              </Field>
              <div className="stack-sm">
                <strong>How did you pay?</strong>
                <div className="seg" role="group" aria-label="Payment">
                  <button
                    className={`chip ${mode === "full" ? "on" : ""}`}
                    aria-pressed={mode === "full"}
                    onClick={() => setMode("full")}
                  >
                    Paid in full
                  </button>
                  <button
                    className={`chip ${mode === "part" ? "on" : ""}`}
                    aria-pressed={mode === "part"}
                    onClick={() => setMode("part")}
                  >
                    Part paid
                  </button>
                  <button
                    className={`chip ${mode === "later" ? "on" : ""}`}
                    aria-pressed={mode === "later"}
                    onClick={() => setMode("later")}
                  >
                    Pay later
                  </button>
                </div>
                {mode === "part" && (
                  <Field label="Amount paid now (₦)" htmlFor="ppart">
                    <input
                      id="ppart"
                      className="input"
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={part}
                      onChange={(e) => setPart(e.target.value)}
                    />
                  </Field>
                )}
                {owed > 0 && !canOwe && (
                  <p className="form-error">
                    Tracking what you owe suppliers is not included in your
                    plan. Record it as paid in full.
                  </p>
                )}
              </div>
            </div>
          )}
          <div className="total-bar" aria-live="polite">
            <div>
              <div className="small" style={{ opacity: 0.85 }}>
                Total cost
              </div>
              <div className="amt num">{money(total)}</div>
            </div>
            {owed > 0 && (
              <div className="right small">
                You will owe
                <br />
                <strong className="num">{money(owed)}</strong>
              </div>
            )}
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button
            className="btn primary block"
            style={{ minHeight: 54 }}
            disabled={
              busy || lines.length === 0 || (sub.data && !sub.data.writable)
            }
            onClick={save}
          >
            {busy ? "Saving…" : "Add to stock"}
          </button>
          <p className="muted small">
            Purchases are not counted as expenses. The cost shows up in your
            profit when you sell the items.
          </p>
        </section>
      </div>
      {addSupplier && (
        <SupplierForm
          title="Add supplier"
          onClose={() => setAddSupplier(false)}
          onSaved={async (s) => {
            await suppliers.reload();
            setSupplierId(s.id);
          }}
        />
      )}
    </div>
  );
}
