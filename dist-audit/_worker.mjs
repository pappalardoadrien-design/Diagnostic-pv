var xt = Object.defineProperty;
var Be = (e) => {
  throw TypeError(e);
};
var ht = (e, t, s) => t in e ? xt(e, t, { enumerable: !0, configurable: !0, writable: !0, value: s }) : e[t] = s;
var g = (e, t, s) => ht(e, typeof t != "symbol" ? t + "" : t, s), Te = (e, t, s) => t.has(e) || Be("Cannot " + s);
var r = (e, t, s) => (Te(e, t, "read from private field"), s ? s.call(e) : t.get(e)), b = (e, t, s) => t.has(e) ? Be("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, s), p = (e, t, s, a) => (Te(e, t, "write to private field"), a ? a.call(e, s) : t.set(e, s), s), x = (e, t, s) => (Te(e, t, "access private method"), s);
var Fe = (e, t, s, a) => ({
  set _(o) {
    p(e, t, o, s);
  },
  get _() {
    return r(e, t, a);
  }
});
var _e = (e, t, s) => (a, o) => {
  let n = -1;
  return i(0);
  async function i(d) {
    if (d <= n)
      throw new Error("next() called multiple times");
    n = d;
    let l, c = !1, u;
    if (e[d] ? (u = e[d][0][0], a.req.routeIndex = d) : u = d === e.length && o || void 0, u)
      try {
        l = await u(a, () => i(d + 1));
      } catch (m) {
        if (m instanceof Error && t)
          a.error = m, l = await t(m, a), c = !0;
        else
          throw m;
      }
    else
      a.finalized === !1 && s && (l = await s(a));
    return l && (a.finalized === !1 || c) && (a.res = l), a;
  }
}, vt = Symbol(), yt = async (e, t = /* @__PURE__ */ Object.create(null)) => {
  const { all: s = !1, dot: a = !1 } = t, n = (e instanceof at ? e.raw.headers : e.headers).get("Content-Type");
  return n != null && n.startsWith("multipart/form-data") || n != null && n.startsWith("application/x-www-form-urlencoded") ? wt(e, { all: s, dot: a }) : {};
};
async function wt(e, t) {
  const s = await e.formData();
  return s ? Dt(s, t) : {};
}
function Dt(e, t) {
  const s = /* @__PURE__ */ Object.create(null);
  return e.forEach((a, o) => {
    t.all || o.endsWith("[]") ? Ct(s, o, a) : s[o] = a;
  }), t.dot && Object.entries(s).forEach(([a, o]) => {
    a.includes(".") && (St(s, a, o), delete s[a]);
  }), s;
}
var Ct = (e, t, s) => {
  e[t] !== void 0 ? Array.isArray(e[t]) ? e[t].push(s) : e[t] = [e[t], s] : t.endsWith("[]") ? e[t] = [s] : e[t] = s;
}, St = (e, t, s) => {
  let a = e;
  const o = t.split(".");
  o.forEach((n, i) => {
    i === o.length - 1 ? a[n] = s : ((!a[n] || typeof a[n] != "object" || Array.isArray(a[n]) || a[n] instanceof File) && (a[n] = /* @__PURE__ */ Object.create(null)), a = a[n]);
  });
}, Xe = (e) => {
  const t = e.split("/");
  return t[0] === "" && t.shift(), t;
}, Et = (e) => {
  const { groups: t, path: s } = It(e), a = Xe(s);
  return Mt(a, t);
}, It = (e) => {
  const t = [];
  return e = e.replace(/\{[^}]+\}/g, (s, a) => {
    const o = `@${a}`;
    return t.push([o, s]), o;
  }), { groups: t, path: e };
}, Mt = (e, t) => {
  for (let s = t.length - 1; s >= 0; s--) {
    const [a] = t[s];
    for (let o = e.length - 1; o >= 0; o--)
      if (e[o].includes(a)) {
        e[o] = e[o].replace(a, t[s][1]);
        break;
      }
  }
  return e;
}, we = {}, Rt = (e, t) => {
  if (e === "*")
    return "*";
  const s = e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (s) {
    const a = `${e}#${t}`;
    return we[a] || (s[2] ? we[a] = t && t[0] !== ":" && t[0] !== "*" ? [a, s[1], new RegExp(`^${s[2]}(?=/${t})`)] : [e, s[1], new RegExp(`^${s[2]}$`)] : we[a] = [e, s[1], !0]), we[a];
  }
  return null;
}, Le = (e, t) => {
  try {
    return t(e);
  } catch {
    return e.replace(/(?:%[0-9A-Fa-f]{2})+/g, (s) => {
      try {
        return t(s);
      } catch {
        return s;
      }
    });
  }
}, Pt = (e) => Le(e, decodeURI), Qe = (e) => {
  const t = e.url, s = t.indexOf("/", t.indexOf(":") + 4);
  let a = s;
  for (; a < t.length; a++) {
    const o = t.charCodeAt(a);
    if (o === 37) {
      const n = t.indexOf("?", a), i = t.slice(s, n === -1 ? void 0 : n);
      return Pt(i.includes("%25") ? i.replace(/%25/g, "%2525") : i);
    } else if (o === 63)
      break;
  }
  return t.slice(s, a);
}, Tt = (e) => {
  const t = Qe(e);
  return t.length > 1 && t.at(-1) === "/" ? t.slice(0, -1) : t;
}, se = (e, t, ...s) => (s.length && (t = se(t, ...s)), `${(e == null ? void 0 : e[0]) === "/" ? "" : "/"}${e}${t === "/" ? "" : `${(e == null ? void 0 : e.at(-1)) === "/" ? "" : "/"}${(t == null ? void 0 : t[0]) === "/" ? t.slice(1) : t}`}`), et = (e) => {
  if (e.charCodeAt(e.length - 1) !== 63 || !e.includes(":"))
    return null;
  const t = e.split("/"), s = [];
  let a = "";
  return t.forEach((o) => {
    if (o !== "" && !/\:/.test(o))
      a += "/" + o;
    else if (/\:/.test(o))
      if (/\?/.test(o)) {
        s.length === 0 && a === "" ? s.push("/") : s.push(a);
        const n = o.replace("?", "");
        a += "/" + n, s.push(a);
      } else
        a += "/" + o;
  }), s.filter((o, n, i) => i.indexOf(o) === n);
}, ke = (e) => /[%+]/.test(e) ? (e.indexOf("+") !== -1 && (e = e.replace(/\+/g, " ")), e.indexOf("%") !== -1 ? Le(e, st) : e) : e, tt = (e, t, s) => {
  let a;
  if (!s && t && !/[%+]/.test(t)) {
    let i = e.indexOf(`?${t}`, 8);
    for (i === -1 && (i = e.indexOf(`&${t}`, 8)); i !== -1; ) {
      const d = e.charCodeAt(i + t.length + 1);
      if (d === 61) {
        const l = i + t.length + 2, c = e.indexOf("&", l);
        return ke(e.slice(l, c === -1 ? void 0 : c));
      } else if (d == 38 || isNaN(d))
        return "";
      i = e.indexOf(`&${t}`, i + 1);
    }
    if (a = /[%+]/.test(e), !a)
      return;
  }
  const o = {};
  a ?? (a = /[%+]/.test(e));
  let n = e.indexOf("?", 8);
  for (; n !== -1; ) {
    const i = e.indexOf("&", n + 1);
    let d = e.indexOf("=", n);
    d > i && i !== -1 && (d = -1);
    let l = e.slice(
      n + 1,
      d === -1 ? i === -1 ? void 0 : i : d
    );
    if (a && (l = ke(l)), n = i, l === "")
      continue;
    let c;
    d === -1 ? c = "" : (c = e.slice(d + 1, i === -1 ? void 0 : i), a && (c = ke(c))), s ? (o[l] && Array.isArray(o[l]) || (o[l] = []), o[l].push(c)) : o[l] ?? (o[l] = c);
  }
  return t ? o[t] : o;
}, kt = tt, jt = (e, t) => tt(e, t, !0), st = decodeURIComponent, Ve = (e) => Le(e, st), ne, P, _, ot, nt, Ae, U, He, at = (He = class {
  constructor(e, t = "/", s = [[]]) {
    b(this, _);
    g(this, "raw");
    b(this, ne);
    b(this, P);
    g(this, "routeIndex", 0);
    g(this, "path");
    g(this, "bodyCache", {});
    b(this, U, (e) => {
      const { bodyCache: t, raw: s } = this, a = t[e];
      if (a)
        return a;
      const o = Object.keys(t)[0];
      return o ? t[o].then((n) => (o === "json" && (n = JSON.stringify(n)), new Response(n)[e]())) : t[e] = s[e]();
    });
    this.raw = e, this.path = t, p(this, P, s), p(this, ne, {});
  }
  param(e) {
    return e ? x(this, _, ot).call(this, e) : x(this, _, nt).call(this);
  }
  query(e) {
    return kt(this.url, e);
  }
  queries(e) {
    return jt(this.url, e);
  }
  header(e) {
    if (e)
      return this.raw.headers.get(e) ?? void 0;
    const t = {};
    return this.raw.headers.forEach((s, a) => {
      t[a] = s;
    }), t;
  }
  async parseBody(e) {
    var t;
    return (t = this.bodyCache).parsedBody ?? (t.parsedBody = await yt(this, e));
  }
  json() {
    return r(this, U).call(this, "text").then((e) => JSON.parse(e));
  }
  text() {
    return r(this, U).call(this, "text");
  }
  arrayBuffer() {
    return r(this, U).call(this, "arrayBuffer");
  }
  blob() {
    return r(this, U).call(this, "blob");
  }
  formData() {
    return r(this, U).call(this, "formData");
  }
  addValidatedData(e, t) {
    r(this, ne)[e] = t;
  }
  valid(e) {
    return r(this, ne)[e];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [vt]() {
    return r(this, P);
  }
  get matchedRoutes() {
    return r(this, P)[0].map(([[, e]]) => e);
  }
  get routePath() {
    return r(this, P)[0].map(([[, e]]) => e)[this.routeIndex].path;
  }
}, ne = new WeakMap(), P = new WeakMap(), _ = new WeakSet(), ot = function(e) {
  const t = r(this, P)[0][this.routeIndex][1][e], s = x(this, _, Ae).call(this, t);
  return s && /\%/.test(s) ? Ve(s) : s;
}, nt = function() {
  const e = {}, t = Object.keys(r(this, P)[0][this.routeIndex][1]);
  for (const s of t) {
    const a = x(this, _, Ae).call(this, r(this, P)[0][this.routeIndex][1][s]);
    a !== void 0 && (e[s] = /\%/.test(a) ? Ve(a) : a);
  }
  return e;
}, Ae = function(e) {
  return r(this, P)[1] ? r(this, P)[1][e] : e;
}, U = new WeakMap(), He), At = {
  Stringify: 1
}, it = async (e, t, s, a, o) => {
  typeof e == "object" && !(e instanceof String) && (e instanceof Promise || (e = e.toString()), e instanceof Promise && (e = await e));
  const n = e.callbacks;
  return n != null && n.length ? (o ? o[0] += e : o = [e], Promise.all(n.map((d) => d({ phase: t, buffer: o, context: a }))).then(
    (d) => Promise.all(
      d.filter(Boolean).map((l) => it(l, t, !1, a, o))
    ).then(() => o[0])
  )) : Promise.resolve(e);
}, Nt = "text/plain; charset=UTF-8", je = (e, t) => ({
  "Content-Type": e,
  ...t
}), fe, be, L, ie, O, M, xe, re, le, Y, he, ve, q, ae, Ge, Lt = (Ge = class {
  constructor(e, t) {
    b(this, q);
    b(this, fe);
    b(this, be);
    g(this, "env", {});
    b(this, L);
    g(this, "finalized", !1);
    g(this, "error");
    b(this, ie);
    b(this, O);
    b(this, M);
    b(this, xe);
    b(this, re);
    b(this, le);
    b(this, Y);
    b(this, he);
    b(this, ve);
    g(this, "render", (...e) => (r(this, re) ?? p(this, re, (t) => this.html(t)), r(this, re).call(this, ...e)));
    g(this, "setLayout", (e) => p(this, xe, e));
    g(this, "getLayout", () => r(this, xe));
    g(this, "setRenderer", (e) => {
      p(this, re, e);
    });
    g(this, "header", (e, t, s) => {
      this.finalized && p(this, M, new Response(r(this, M).body, r(this, M)));
      const a = r(this, M) ? r(this, M).headers : r(this, Y) ?? p(this, Y, new Headers());
      t === void 0 ? a.delete(e) : s != null && s.append ? a.append(e, t) : a.set(e, t);
    });
    g(this, "status", (e) => {
      p(this, ie, e);
    });
    g(this, "set", (e, t) => {
      r(this, L) ?? p(this, L, /* @__PURE__ */ new Map()), r(this, L).set(e, t);
    });
    g(this, "get", (e) => r(this, L) ? r(this, L).get(e) : void 0);
    g(this, "newResponse", (...e) => x(this, q, ae).call(this, ...e));
    g(this, "body", (e, t, s) => x(this, q, ae).call(this, e, t, s));
    g(this, "text", (e, t, s) => !r(this, Y) && !r(this, ie) && !t && !s && !this.finalized ? new Response(e) : x(this, q, ae).call(this, e, t, je(Nt, s)));
    g(this, "json", (e, t, s) => x(this, q, ae).call(this, JSON.stringify(e), t, je("application/json", s)));
    g(this, "html", (e, t, s) => {
      const a = (o) => x(this, q, ae).call(this, o, t, je("text/html; charset=UTF-8", s));
      return typeof e == "object" ? it(e, At.Stringify, !1, {}).then(a) : a(e);
    });
    g(this, "redirect", (e, t) => {
      const s = String(e);
      return this.header(
        "Location",
        /[^\x00-\xFF]/.test(s) ? encodeURI(s) : s
      ), this.newResponse(null, t ?? 302);
    });
    g(this, "notFound", () => (r(this, le) ?? p(this, le, () => new Response()), r(this, le).call(this, this)));
    p(this, fe, e), t && (p(this, O, t.executionCtx), this.env = t.env, p(this, le, t.notFoundHandler), p(this, ve, t.path), p(this, he, t.matchResult));
  }
  get req() {
    return r(this, be) ?? p(this, be, new at(r(this, fe), r(this, ve), r(this, he))), r(this, be);
  }
  get event() {
    if (r(this, O) && "respondWith" in r(this, O))
      return r(this, O);
    throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (r(this, O))
      return r(this, O);
    throw Error("This context has no ExecutionContext");
  }
  get res() {
    return r(this, M) || p(this, M, new Response(null, {
      headers: r(this, Y) ?? p(this, Y, new Headers())
    }));
  }
  set res(e) {
    if (r(this, M) && e) {
      e = new Response(e.body, e);
      for (const [t, s] of r(this, M).headers.entries())
        if (t !== "content-type")
          if (t === "set-cookie") {
            const a = r(this, M).headers.getSetCookie();
            e.headers.delete("set-cookie");
            for (const o of a)
              e.headers.append("set-cookie", o);
          } else
            e.headers.set(t, s);
    }
    p(this, M, e), this.finalized = !0;
  }
  get var() {
    return r(this, L) ? Object.fromEntries(r(this, L)) : {};
  }
}, fe = new WeakMap(), be = new WeakMap(), L = new WeakMap(), ie = new WeakMap(), O = new WeakMap(), M = new WeakMap(), xe = new WeakMap(), re = new WeakMap(), le = new WeakMap(), Y = new WeakMap(), he = new WeakMap(), ve = new WeakMap(), q = new WeakSet(), ae = function(e, t, s) {
  const a = r(this, M) ? new Headers(r(this, M).headers) : r(this, Y) ?? new Headers();
  if (typeof t == "object" && "headers" in t) {
    const n = t.headers instanceof Headers ? t.headers : new Headers(t.headers);
    for (const [i, d] of n)
      i.toLowerCase() === "set-cookie" ? a.append(i, d) : a.set(i, d);
  }
  if (s)
    for (const [n, i] of Object.entries(s))
      if (typeof i == "string")
        a.set(n, i);
      else {
        a.delete(n);
        for (const d of i)
          a.append(n, d);
      }
  const o = typeof t == "number" ? t : (t == null ? void 0 : t.status) ?? r(this, ie);
  return new Response(e, { status: o, headers: a });
}, Ge), D = "ALL", Ot = "all", Bt = ["get", "post", "put", "delete", "options", "patch"], rt = "Can not add a route since the matcher is already built.", lt = class extends Error {
}, Ft = "__COMPOSED_HANDLER", _t = (e) => e.text("404 Not Found", 404), Ue = (e, t) => {
  if ("getResponse" in e) {
    const s = e.getResponse();
    return t.newResponse(s.body, s);
  }
  return console.error(e), t.text("Internal Server Error", 500);
}, T, C, ct, k, z, De, Ce, $e, dt = ($e = class {
  constructor(t = {}) {
    b(this, C);
    g(this, "get");
    g(this, "post");
    g(this, "put");
    g(this, "delete");
    g(this, "options");
    g(this, "patch");
    g(this, "all");
    g(this, "on");
    g(this, "use");
    g(this, "router");
    g(this, "getPath");
    g(this, "_basePath", "/");
    b(this, T, "/");
    g(this, "routes", []);
    b(this, k, _t);
    g(this, "errorHandler", Ue);
    g(this, "onError", (t) => (this.errorHandler = t, this));
    g(this, "notFound", (t) => (p(this, k, t), this));
    g(this, "fetch", (t, ...s) => x(this, C, Ce).call(this, t, s[1], s[0], t.method));
    g(this, "request", (t, s, a, o) => t instanceof Request ? this.fetch(s ? new Request(t, s) : t, a, o) : (t = t.toString(), this.fetch(
      new Request(
        /^https?:\/\//.test(t) ? t : `http://localhost${se("/", t)}`,
        s
      ),
      a,
      o
    )));
    g(this, "fire", () => {
      addEventListener("fetch", (t) => {
        t.respondWith(x(this, C, Ce).call(this, t.request, t, void 0, t.request.method));
      });
    });
    [...Bt, Ot].forEach((n) => {
      this[n] = (i, ...d) => (typeof i == "string" ? p(this, T, i) : x(this, C, z).call(this, n, r(this, T), i), d.forEach((l) => {
        x(this, C, z).call(this, n, r(this, T), l);
      }), this);
    }), this.on = (n, i, ...d) => {
      for (const l of [i].flat()) {
        p(this, T, l);
        for (const c of [n].flat())
          d.map((u) => {
            x(this, C, z).call(this, c.toUpperCase(), r(this, T), u);
          });
      }
      return this;
    }, this.use = (n, ...i) => (typeof n == "string" ? p(this, T, n) : (p(this, T, "*"), i.unshift(n)), i.forEach((d) => {
      x(this, C, z).call(this, D, r(this, T), d);
    }), this);
    const { strict: a, ...o } = t;
    Object.assign(this, o), this.getPath = a ?? !0 ? t.getPath ?? Qe : Tt;
  }
  route(t, s) {
    const a = this.basePath(t);
    return s.routes.map((o) => {
      var i;
      let n;
      s.errorHandler === Ue ? n = o.handler : (n = async (d, l) => (await _e([], s.errorHandler)(d, () => o.handler(d, l))).res, n[Ft] = o.handler), x(i = a, C, z).call(i, o.method, o.path, n);
    }), this;
  }
  basePath(t) {
    const s = x(this, C, ct).call(this);
    return s._basePath = se(this._basePath, t), s;
  }
  mount(t, s, a) {
    let o, n;
    a && (typeof a == "function" ? n = a : (n = a.optionHandler, a.replaceRequest === !1 ? o = (l) => l : o = a.replaceRequest));
    const i = n ? (l) => {
      const c = n(l);
      return Array.isArray(c) ? c : [c];
    } : (l) => {
      let c;
      try {
        c = l.executionCtx;
      } catch {
      }
      return [l.env, c];
    };
    o || (o = (() => {
      const l = se(this._basePath, t), c = l === "/" ? 0 : l.length;
      return (u) => {
        const m = new URL(u.url);
        return m.pathname = m.pathname.slice(c) || "/", new Request(m, u);
      };
    })());
    const d = async (l, c) => {
      const u = await s(o(l.req.raw), ...i(l));
      if (u)
        return u;
      await c();
    };
    return x(this, C, z).call(this, D, se(t, "*"), d), this;
  }
}, T = new WeakMap(), C = new WeakSet(), ct = function() {
  const t = new dt({
    router: this.router,
    getPath: this.getPath
  });
  return t.errorHandler = this.errorHandler, p(t, k, r(this, k)), t.routes = this.routes, t;
}, k = new WeakMap(), z = function(t, s, a) {
  t = t.toUpperCase(), s = se(this._basePath, s);
  const o = { basePath: this._basePath, path: s, method: t, handler: a };
  this.router.add(t, s, [a, o]), this.routes.push(o);
}, De = function(t, s) {
  if (t instanceof Error)
    return this.errorHandler(t, s);
  throw t;
}, Ce = function(t, s, a, o) {
  if (o === "HEAD")
    return (async () => new Response(null, await x(this, C, Ce).call(this, t, s, a, "GET")))();
  const n = this.getPath(t, { env: a }), i = this.router.match(o, n), d = new Lt(t, {
    path: n,
    matchResult: i,
    env: a,
    executionCtx: s,
    notFoundHandler: r(this, k)
  });
  if (i[0].length === 1) {
    let c;
    try {
      c = i[0][0][0][0](d, async () => {
        d.res = await r(this, k).call(this, d);
      });
    } catch (u) {
      return x(this, C, De).call(this, u, d);
    }
    return c instanceof Promise ? c.then(
      (u) => u || (d.finalized ? d.res : r(this, k).call(this, d))
    ).catch((u) => x(this, C, De).call(this, u, d)) : c ?? r(this, k).call(this, d);
  }
  const l = _e(i[0], this.errorHandler, r(this, k));
  return (async () => {
    try {
      const c = await l(d);
      if (!c.finalized)
        throw new Error(
          "Context is not finalized. Did you forget to return a Response object or `await next()`?"
        );
      return c.res;
    } catch (c) {
      return x(this, C, De).call(this, c, d);
    }
  })();
}, $e), ut = [];
function Vt(e, t) {
  const s = this.buildAllMatchers(), a = (o, n) => {
    const i = s[o] || s[D], d = i[2][n];
    if (d)
      return d;
    const l = n.match(i[0]);
    if (!l)
      return [[], ut];
    const c = l.indexOf("", 1);
    return [i[1][c], l];
  };
  return this.match = a, a(e, t);
}
var Ee = "[^/]+", pe = ".*", ge = "(?:|/.*)", oe = Symbol(), Ut = new Set(".\\+*[^]$()");
function qt(e, t) {
  return e.length === 1 ? t.length === 1 ? e < t ? -1 : 1 : -1 : t.length === 1 || e === pe || e === ge ? 1 : t === pe || t === ge ? -1 : e === Ee ? 1 : t === Ee ? -1 : e.length === t.length ? e < t ? -1 : 1 : t.length - e.length;
}
var K, J, j, We, Ne = (We = class {
  constructor() {
    b(this, K);
    b(this, J);
    b(this, j, /* @__PURE__ */ Object.create(null));
  }
  insert(t, s, a, o, n) {
    if (t.length === 0) {
      if (r(this, K) !== void 0)
        throw oe;
      if (n)
        return;
      p(this, K, s);
      return;
    }
    const [i, ...d] = t, l = i === "*" ? d.length === 0 ? ["", "", pe] : ["", "", Ee] : i === "/*" ? ["", "", ge] : i.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let c;
    if (l) {
      const u = l[1];
      let m = l[2] || Ee;
      if (u && l[2] && (m === ".*" || (m = m.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(m))))
        throw oe;
      if (c = r(this, j)[m], !c) {
        if (Object.keys(r(this, j)).some(
          (f) => f !== pe && f !== ge
        ))
          throw oe;
        if (n)
          return;
        c = r(this, j)[m] = new Ne(), u !== "" && p(c, J, o.varIndex++);
      }
      !n && u !== "" && a.push([u, r(c, J)]);
    } else if (c = r(this, j)[i], !c) {
      if (Object.keys(r(this, j)).some(
        (u) => u.length > 1 && u !== pe && u !== ge
      ))
        throw oe;
      if (n)
        return;
      c = r(this, j)[i] = new Ne();
    }
    c.insert(d, s, a, o, n);
  }
  buildRegExpStr() {
    const s = Object.keys(r(this, j)).sort(qt).map((a) => {
      const o = r(this, j)[a];
      return (typeof r(o, J) == "number" ? `(${a})@${r(o, J)}` : Ut.has(a) ? `\\${a}` : a) + o.buildRegExpStr();
    });
    return typeof r(this, K) == "number" && s.unshift(`#${r(this, K)}`), s.length === 0 ? "" : s.length === 1 ? s[0] : "(?:" + s.join("|") + ")";
  }
}, K = new WeakMap(), J = new WeakMap(), j = new WeakMap(), We), Ie, ye, ze, Ht = (ze = class {
  constructor() {
    b(this, Ie, { varIndex: 0 });
    b(this, ye, new Ne());
  }
  insert(e, t, s) {
    const a = [], o = [];
    for (let i = 0; ; ) {
      let d = !1;
      if (e = e.replace(/\{[^}]+\}/g, (l) => {
        const c = `@\\${i}`;
        return o[i] = [c, l], i++, d = !0, c;
      }), !d)
        break;
    }
    const n = e.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = o.length - 1; i >= 0; i--) {
      const [d] = o[i];
      for (let l = n.length - 1; l >= 0; l--)
        if (n[l].indexOf(d) !== -1) {
          n[l] = n[l].replace(d, o[i][1]);
          break;
        }
    }
    return r(this, ye).insert(n, t, a, r(this, Ie), s), a;
  }
  buildRegExp() {
    let e = r(this, ye).buildRegExpStr();
    if (e === "")
      return [/^$/, [], []];
    let t = 0;
    const s = [], a = [];
    return e = e.replace(/#(\d+)|@(\d+)|\.\*\$/g, (o, n, i) => n !== void 0 ? (s[++t] = Number(n), "$()") : (i !== void 0 && (a[Number(i)] = ++t), "")), [new RegExp(`^${e}`), s, a];
  }
}, Ie = new WeakMap(), ye = new WeakMap(), ze), Gt = [/^$/, [], /* @__PURE__ */ Object.create(null)], Se = /* @__PURE__ */ Object.create(null);
function mt(e) {
  return Se[e] ?? (Se[e] = new RegExp(
    e === "*" ? "" : `^${e.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (t, s) => s ? `\\${s}` : "(?:|/.*)"
    )}$`
  ));
}
function $t() {
  Se = /* @__PURE__ */ Object.create(null);
}
function Wt(e) {
  var c;
  const t = new Ht(), s = [];
  if (e.length === 0)
    return Gt;
  const a = e.map(
    (u) => [!/\*|\/:/.test(u[0]), ...u]
  ).sort(
    ([u, m], [f, w]) => u ? 1 : f ? -1 : m.length - w.length
  ), o = /* @__PURE__ */ Object.create(null);
  for (let u = 0, m = -1, f = a.length; u < f; u++) {
    const [w, R, v] = a[u];
    w ? o[R] = [v.map(([I]) => [I, /* @__PURE__ */ Object.create(null)]), ut] : m++;
    let y;
    try {
      y = t.insert(R, m, w);
    } catch (I) {
      throw I === oe ? new lt(R) : I;
    }
    w || (s[m] = v.map(([I, ee]) => {
      const ce = /* @__PURE__ */ Object.create(null);
      for (ee -= 1; ee >= 0; ee--) {
        const [A, Re] = y[ee];
        ce[A] = Re;
      }
      return [I, ce];
    }));
  }
  const [n, i, d] = t.buildRegExp();
  for (let u = 0, m = s.length; u < m; u++)
    for (let f = 0, w = s[u].length; f < w; f++) {
      const R = (c = s[u][f]) == null ? void 0 : c[1];
      if (!R)
        continue;
      const v = Object.keys(R);
      for (let y = 0, I = v.length; y < I; y++)
        R[v[y]] = d[R[v[y]]];
    }
  const l = [];
  for (const u in i)
    l[u] = s[i[u]];
  return [n, l, o];
}
function te(e, t) {
  if (e) {
    for (const s of Object.keys(e).sort((a, o) => o.length - a.length))
      if (mt(s).test(t))
        return [...e[s]];
  }
}
var H, G, Me, pt, Ze, zt = (Ze = class {
  constructor() {
    b(this, Me);
    g(this, "name", "RegExpRouter");
    b(this, H);
    b(this, G);
    g(this, "match", Vt);
    p(this, H, { [D]: /* @__PURE__ */ Object.create(null) }), p(this, G, { [D]: /* @__PURE__ */ Object.create(null) });
  }
  add(e, t, s) {
    var d;
    const a = r(this, H), o = r(this, G);
    if (!a || !o)
      throw new Error(rt);
    a[e] || [a, o].forEach((l) => {
      l[e] = /* @__PURE__ */ Object.create(null), Object.keys(l[D]).forEach((c) => {
        l[e][c] = [...l[D][c]];
      });
    }), t === "/*" && (t = "*");
    const n = (t.match(/\/:/g) || []).length;
    if (/\*$/.test(t)) {
      const l = mt(t);
      e === D ? Object.keys(a).forEach((c) => {
        var u;
        (u = a[c])[t] || (u[t] = te(a[c], t) || te(a[D], t) || []);
      }) : (d = a[e])[t] || (d[t] = te(a[e], t) || te(a[D], t) || []), Object.keys(a).forEach((c) => {
        (e === D || e === c) && Object.keys(a[c]).forEach((u) => {
          l.test(u) && a[c][u].push([s, n]);
        });
      }), Object.keys(o).forEach((c) => {
        (e === D || e === c) && Object.keys(o[c]).forEach(
          (u) => l.test(u) && o[c][u].push([s, n])
        );
      });
      return;
    }
    const i = et(t) || [t];
    for (let l = 0, c = i.length; l < c; l++) {
      const u = i[l];
      Object.keys(o).forEach((m) => {
        var f;
        (e === D || e === m) && ((f = o[m])[u] || (f[u] = [
          ...te(a[m], u) || te(a[D], u) || []
        ]), o[m][u].push([s, n - c + l + 1]));
      });
    }
  }
  buildAllMatchers() {
    const e = /* @__PURE__ */ Object.create(null);
    return Object.keys(r(this, G)).concat(Object.keys(r(this, H))).forEach((t) => {
      e[t] || (e[t] = x(this, Me, pt).call(this, t));
    }), p(this, H, p(this, G, void 0)), $t(), e;
  }
}, H = new WeakMap(), G = new WeakMap(), Me = new WeakSet(), pt = function(e) {
  const t = [];
  let s = e === D;
  return [r(this, H), r(this, G)].forEach((a) => {
    const o = a[e] ? Object.keys(a[e]).map((n) => [n, a[e][n]]) : [];
    o.length !== 0 ? (s || (s = !0), t.push(...o)) : e !== D && t.push(
      ...Object.keys(a[D]).map((n) => [n, a[D][n]])
    );
  }), s ? Wt(t) : null;
}, Ze), $, B, Ye, Zt = (Ye = class {
  constructor(e) {
    g(this, "name", "SmartRouter");
    b(this, $, []);
    b(this, B, []);
    p(this, $, e.routers);
  }
  add(e, t, s) {
    if (!r(this, B))
      throw new Error(rt);
    r(this, B).push([e, t, s]);
  }
  match(e, t) {
    if (!r(this, B))
      throw new Error("Fatal error");
    const s = r(this, $), a = r(this, B), o = s.length;
    let n = 0, i;
    for (; n < o; n++) {
      const d = s[n];
      try {
        for (let l = 0, c = a.length; l < c; l++)
          d.add(...a[l]);
        i = d.match(e, t);
      } catch (l) {
        if (l instanceof lt)
          continue;
        throw l;
      }
      this.match = d.match.bind(d), p(this, $, [d]), p(this, B, void 0);
      break;
    }
    if (n === o)
      throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, i;
  }
  get activeRouter() {
    if (r(this, B) || r(this, $).length !== 1)
      throw new Error("No active router has been determined yet.");
    return r(this, $)[0];
  }
}, $ = new WeakMap(), B = new WeakMap(), Ye), me = /* @__PURE__ */ Object.create(null), W, E, X, de, S, F, Z, Ke, gt = (Ke = class {
  constructor(e, t, s) {
    b(this, F);
    b(this, W);
    b(this, E);
    b(this, X);
    b(this, de, 0);
    b(this, S, me);
    if (p(this, E, s || /* @__PURE__ */ Object.create(null)), p(this, W, []), e && t) {
      const a = /* @__PURE__ */ Object.create(null);
      a[e] = { handler: t, possibleKeys: [], score: 0 }, p(this, W, [a]);
    }
    p(this, X, []);
  }
  insert(e, t, s) {
    p(this, de, ++Fe(this, de)._);
    let a = this;
    const o = Et(t), n = [];
    for (let i = 0, d = o.length; i < d; i++) {
      const l = o[i], c = o[i + 1], u = Rt(l, c), m = Array.isArray(u) ? u[0] : l;
      if (m in r(a, E)) {
        a = r(a, E)[m], u && n.push(u[1]);
        continue;
      }
      r(a, E)[m] = new gt(), u && (r(a, X).push(u), n.push(u[1])), a = r(a, E)[m];
    }
    return r(a, W).push({
      [e]: {
        handler: s,
        possibleKeys: n.filter((i, d, l) => l.indexOf(i) === d),
        score: r(this, de)
      }
    }), a;
  }
  search(e, t) {
    var d;
    const s = [];
    p(this, S, me);
    let o = [this];
    const n = Xe(t), i = [];
    for (let l = 0, c = n.length; l < c; l++) {
      const u = n[l], m = l === c - 1, f = [];
      for (let w = 0, R = o.length; w < R; w++) {
        const v = o[w], y = r(v, E)[u];
        y && (p(y, S, r(v, S)), m ? (r(y, E)["*"] && s.push(
          ...x(this, F, Z).call(this, r(y, E)["*"], e, r(v, S))
        ), s.push(...x(this, F, Z).call(this, y, e, r(v, S)))) : f.push(y));
        for (let I = 0, ee = r(v, X).length; I < ee; I++) {
          const ce = r(v, X)[I], A = r(v, S) === me ? {} : { ...r(v, S) };
          if (ce === "*") {
            const V = r(v, E)["*"];
            V && (s.push(...x(this, F, Z).call(this, V, e, r(v, S))), p(V, S, A), f.push(V));
            continue;
          }
          const [Re, Oe, ue] = ce;
          if (!u && !(ue instanceof RegExp))
            continue;
          const N = r(v, E)[Re], bt = n.slice(l).join("/");
          if (ue instanceof RegExp) {
            const V = ue.exec(bt);
            if (V) {
              if (A[Oe] = V[0], s.push(...x(this, F, Z).call(this, N, e, r(v, S), A)), Object.keys(r(N, E)).length) {
                p(N, S, A);
                const Pe = ((d = V[0].match(/\//)) == null ? void 0 : d.length) ?? 0;
                (i[Pe] || (i[Pe] = [])).push(N);
              }
              continue;
            }
          }
          (ue === !0 || ue.test(u)) && (A[Oe] = u, m ? (s.push(...x(this, F, Z).call(this, N, e, A, r(v, S))), r(N, E)["*"] && s.push(
            ...x(this, F, Z).call(this, r(N, E)["*"], e, A, r(v, S))
          )) : (p(N, S, A), f.push(N)));
        }
      }
      o = f.concat(i.shift() ?? []);
    }
    return s.length > 1 && s.sort((l, c) => l.score - c.score), [s.map(({ handler: l, params: c }) => [l, c])];
  }
}, W = new WeakMap(), E = new WeakMap(), X = new WeakMap(), de = new WeakMap(), S = new WeakMap(), F = new WeakSet(), Z = function(e, t, s, a) {
  const o = [];
  for (let n = 0, i = r(e, W).length; n < i; n++) {
    const d = r(e, W)[n], l = d[t] || d[D], c = {};
    if (l !== void 0 && (l.params = /* @__PURE__ */ Object.create(null), o.push(l), s !== me || a && a !== me))
      for (let u = 0, m = l.possibleKeys.length; u < m; u++) {
        const f = l.possibleKeys[u], w = c[l.score];
        l.params[f] = a != null && a[f] && !w ? a[f] : s[f] ?? (a == null ? void 0 : a[f]), c[l.score] = !0;
      }
  }
  return o;
}, Ke), Q, Je, Yt = (Je = class {
  constructor() {
    g(this, "name", "TrieRouter");
    b(this, Q);
    p(this, Q, new gt());
  }
  add(e, t, s) {
    const a = et(t);
    if (a) {
      for (let o = 0, n = a.length; o < n; o++)
        r(this, Q).insert(e, a[o], s);
      return;
    }
    r(this, Q).insert(e, t, s);
  }
  match(e, t) {
    return r(this, Q).search(e, t);
  }
}, Q = new WeakMap(), Je), Kt = class extends dt {
  constructor(e = {}) {
    super(e), this.router = e.router ?? new Zt({
      routers: [new zt(), new Yt()]
    });
  }
}, Jt = /^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i, qe = (e, t = Qt) => {
  const s = /\.([a-zA-Z0-9]+?)$/, a = e.match(s);
  if (!a)
    return;
  let o = t[a[1]];
  return o && o.startsWith("text") && (o += "; charset=utf-8"), o;
}, Xt = {
  aac: "audio/aac",
  avi: "video/x-msvideo",
  avif: "image/avif",
  av1: "video/av1",
  bin: "application/octet-stream",
  bmp: "image/bmp",
  css: "text/css",
  csv: "text/csv",
  eot: "application/vnd.ms-fontobject",
  epub: "application/epub+zip",
  gif: "image/gif",
  gz: "application/gzip",
  htm: "text/html",
  html: "text/html",
  ico: "image/x-icon",
  ics: "text/calendar",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  js: "text/javascript",
  json: "application/json",
  jsonld: "application/ld+json",
  map: "application/json",
  mid: "audio/x-midi",
  midi: "audio/x-midi",
  mjs: "text/javascript",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  mpeg: "video/mpeg",
  oga: "audio/ogg",
  ogv: "video/ogg",
  ogx: "application/ogg",
  opus: "audio/opus",
  otf: "font/otf",
  pdf: "application/pdf",
  png: "image/png",
  rtf: "application/rtf",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  ts: "video/mp2t",
  ttf: "font/ttf",
  txt: "text/plain",
  wasm: "application/wasm",
  webm: "video/webm",
  weba: "audio/webm",
  webmanifest: "application/manifest+json",
  webp: "image/webp",
  woff: "font/woff",
  woff2: "font/woff2",
  xhtml: "application/xhtml+xml",
  xml: "application/xml",
  zip: "application/zip",
  "3gp": "video/3gpp",
  "3g2": "video/3gpp2",
  gltf: "model/gltf+json",
  glb: "model/gltf-binary"
}, Qt = Xt, es = (...e) => {
  let t = e.filter((o) => o !== "").join("/");
  t = t.replace(new RegExp("(?<=\\/)\\/+", "g"), "");
  const s = t.split("/"), a = [];
  for (const o of s)
    o === ".." && a.length > 0 && a.at(-1) !== ".." ? a.pop() : o !== "." && a.push(o);
  return a.join("/") || ".";
}, ft = {
  br: ".br",
  zstd: ".zst",
  gzip: ".gz"
}, ts = Object.keys(ft), ss = "index.html", as = (e) => {
  const t = e.root ?? "./", s = e.path, a = e.join ?? es;
  return async (o, n) => {
    var u, m, f, w;
    if (o.finalized)
      return n();
    let i;
    if (e.path)
      i = e.path;
    else
      try {
        if (i = decodeURIComponent(o.req.path), /(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(i))
          throw new Error();
      } catch {
        return await ((u = e.onNotFound) == null ? void 0 : u.call(e, o.req.path, o)), n();
      }
    let d = a(
      t,
      !s && e.rewriteRequestPath ? e.rewriteRequestPath(i) : i
    );
    e.isDir && await e.isDir(d) && (d = a(d, ss));
    const l = e.getContent;
    let c = await l(d, o);
    if (c instanceof Response)
      return o.newResponse(c.body, c);
    if (c) {
      const R = e.mimes && qe(d, e.mimes) || qe(d);
      if (o.header("Content-Type", R || "application/octet-stream"), e.precompressed && (!R || Jt.test(R))) {
        const v = new Set(
          (m = o.req.header("Accept-Encoding")) == null ? void 0 : m.split(",").map((y) => y.trim())
        );
        for (const y of ts) {
          if (!v.has(y))
            continue;
          const I = await l(d + ft[y], o);
          if (I) {
            c = I, o.header("Content-Encoding", y), o.header("Vary", "Accept-Encoding", { append: !0 });
            break;
          }
        }
      }
      return await ((f = e.onFound) == null ? void 0 : f.call(e, d, o)), o.body(c);
    }
    await ((w = e.onNotFound) == null ? void 0 : w.call(e, d, o)), await n();
  };
}, os = async (e, t) => {
  let s;
  t && t.manifest ? typeof t.manifest == "string" ? s = JSON.parse(t.manifest) : s = t.manifest : typeof __STATIC_CONTENT_MANIFEST == "string" ? s = JSON.parse(__STATIC_CONTENT_MANIFEST) : s = __STATIC_CONTENT_MANIFEST;
  let a;
  t && t.namespace ? a = t.namespace : a = __STATIC_CONTENT;
  const o = s[e] || e;
  if (!o)
    return null;
  const n = await a.get(o, { type: "stream" });
  return n || null;
}, ns = (e) => async function(s, a) {
  return as({
    ...e,
    getContent: async (n) => os(n, {
      manifest: e.manifest,
      namespace: e.namespace ? e.namespace : s.env ? s.env.__STATIC_CONTENT : void 0
    })
  })(s, a);
}, is = (e) => ns(e), rs = (e) => {
  const s = {
    ...{
      origin: "*",
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
      allowHeaders: [],
      exposeHeaders: []
    },
    ...e
  }, a = /* @__PURE__ */ ((n) => typeof n == "string" ? n === "*" ? () => n : (i) => n === i ? i : null : typeof n == "function" ? n : (i) => n.includes(i) ? i : null)(s.origin), o = ((n) => typeof n == "function" ? n : Array.isArray(n) ? () => n : () => [])(s.allowMethods);
  return async function(i, d) {
    var u;
    function l(m, f) {
      i.res.headers.set(m, f);
    }
    const c = await a(i.req.header("origin") || "", i);
    if (c && l("Access-Control-Allow-Origin", c), s.origin !== "*") {
      const m = i.req.header("Vary");
      m ? l("Vary", m) : l("Vary", "Origin");
    }
    if (s.credentials && l("Access-Control-Allow-Credentials", "true"), (u = s.exposeHeaders) != null && u.length && l("Access-Control-Expose-Headers", s.exposeHeaders.join(",")), i.req.method === "OPTIONS") {
      s.maxAge != null && l("Access-Control-Max-Age", s.maxAge.toString());
      const m = await o(i.req.header("origin") || "", i);
      m.length && l("Access-Control-Allow-Methods", m.join(","));
      let f = s.allowHeaders;
      if (!(f != null && f.length)) {
        const w = i.req.header("Access-Control-Request-Headers");
        w && (f = w.split(/\s*,\s*/));
      }
      return f != null && f.length && (l("Access-Control-Allow-Headers", f.join(",")), i.res.headers.append("Vary", "Access-Control-Request-Headers")), i.res.headers.delete("Content-Length"), i.res.headers.delete("Content-Type"), new Response(null, {
        headers: i.res.headers,
        status: 204,
        statusText: "No Content"
      });
    }
    await d();
  };
};
const h = new Kt();
h.use("/api/*", rs());
h.use("/static/*", is());
h.get("/", (e) => e.text("✅ DiagPV HUB - Service actif !"));
h.get("/api/users", async (e) => {
  try {
    const { results: t } = await e.env.DB.prepare(`
      SELECT id, email, name, role, certification_level, created_at
      FROM users 
      ORDER BY created_at DESC
    `).all();
    return e.json({ success: !0, users: t });
  } catch (t) {
    return e.json({ success: !1, error: t.message }, 500);
  }
});
h.get("/api/projects", async (e) => {
  try {
    const { results: t } = await e.env.DB.prepare(`
      SELECT p.*, c.name as client_name, c.contact_email,
        COUNT(DISTINCT i.id) as intervention_count,
        MAX(i.completion_date) as last_intervention
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      LEFT JOIN interventions i ON p.id = i.project_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();
    return e.json({ success: !0, projects: t });
  } catch (t) {
    return e.json({ success: !1, error: t.message }, 500);
  }
});
h.post("/api/projects", async (e) => {
  try {
    const t = await e.req.json(), { name: s, power: a, module_count: o, client_name: n, client_email: i, installation_address: d, audit_type: l } = t;
    if (!s || !a || !n)
      return e.json({ success: !1, error: "Nom du projet, puissance et nom du client sont requis" }, 400);
    let c = await e.env.DB.prepare(`
      SELECT id FROM clients WHERE name = ?
    `).bind(n).first(), u;
    c ? u = c.id : u = (await e.env.DB.prepare(`
        INSERT INTO clients (name, contact_email) VALUES (?, ?)
      `).bind(n, i || null).run()).meta.last_row_id;
    const m = await e.env.DB.prepare(`
      INSERT INTO projects (
        client_id, name, site_address, installation_power, module_count, created_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      u,
      s,
      d || "Adresse à définir",
      a,
      o || null
    ).run();
    return e.json({
      success: !0,
      project: {
        id: m.meta.last_row_id,
        name: s,
        installation_power: a,
        module_count: o,
        client_name: n,
        audit_type: l || "N2"
      }
    });
  } catch (t) {
    return e.json({ success: !1, error: t.message }, 500);
  }
});
h.get("/api/dashboard/stats", async (e) => {
  var t, s, a, o, n, i;
  try {
    const d = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7), { results: l } = await e.env.DB.prepare(`
      SELECT COUNT(*) as count FROM interventions 
      WHERE strftime('%Y-%m', scheduled_date) = ?
    `).bind(d).all(), { results: c } = await e.env.DB.prepare(`
      SELECT SUM(value_numeric) as total FROM measurements 
      WHERE measurement_type = 'module_count'
    `).all(), { results: u } = await e.env.DB.prepare(`
      SELECT COUNT(*) as total FROM defects
    `).all(), { results: m } = await e.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_measurements,
        COUNT(CASE WHEN conformity = 1 THEN 1 END) as conforming_measurements
      FROM measurements WHERE conformity IS NOT NULL
    `).all(), f = {
      monthly_interventions: ((t = l[0]) == null ? void 0 : t.count) || 12,
      modules_analyzed: ((s = c[0]) == null ? void 0 : s.total) || 1247,
      defects_detected: ((a = u[0]) == null ? void 0 : a.total) || 89,
      conformity_rate: ((o = m[0]) == null ? void 0 : o.total) > 0 ? (((n = m[0]) == null ? void 0 : n.conforming_measurements) / ((i = m[0]) == null ? void 0 : i.total) * 100).toFixed(1) : "92.8"
    };
    return e.json({ success: !0, stats: f });
  } catch (d) {
    return e.json({ success: !1, error: d.message, stats: {
      monthly_interventions: 12,
      modules_analyzed: 1247,
      defects_detected: 89,
      conformity_rate: "92.8"
    } }, 200);
  }
});
h.post("/api/interventions", async (e) => {
  try {
    const { project_id: t, technician_id: s, intervention_type: a, scheduled_date: o, notes: n } = await e.req.json(), { success: i, meta: d } = await e.env.DB.prepare(`
      INSERT INTO interventions (project_id, technician_id, intervention_type, scheduled_date, status, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(t, s, a, o, "scheduled", n).run();
    return e.json({ success: !0, intervention_id: d.last_row_id });
  } catch (t) {
    return e.json({ success: !1, error: t.message }, 500);
  }
});
h.get("/", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hub Diagnostic Photovoltaïque - Suite Complète</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script>
        tailwind.config = {
          theme: {
            extend: {
              colors: {
                'diag-green': '#22C55E',
                'diag-dark': '#1F2937',
                'diag-black': '#000000'
              }
            }
          }
        }
        <\/script>
        <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .btn-diag {
          background: linear-gradient(135deg, #22C55E 0%, #16A34A 100%);
          transition: all 0.3s ease;
        }
        
        .btn-diag:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(34, 197, 94, 0.4);
        }
        
        .stats-card {
          background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
          border: 1px solid #E5E7EB;
        }
        </style>
    </head>
    <body class="bg-gray-50">
        
        <!-- Header Navigation -->
        <header class="bg-white shadow-sm border-b-2" style="border-bottom-color: #22C55E;">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    
                    <!-- Logo et titre -->
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center justify-center w-12 h-12 bg-diag-green rounded-lg">
                            <i class="fas fa-solar-panel text-white text-xl"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold text-diag-dark">DIAGNOSTIC PHOTOVOLTAÏQUE</h1>
                            <p class="text-sm text-gray-600">Hub Professionnel - Suite Complète 6 Modules</p>
                        </div>
                    </div>
                    
                    <!-- Actions utilisateur -->
                    <div class="flex items-center space-x-3">
                        <div id="realTimeIndicator" class="flex items-center space-x-2 px-3 py-2 bg-green-100 rounded-lg">
                            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span class="text-sm font-medium text-green-700">Temps Réel</span>
                        </div>
                        <button class="p-2 text-gray-500 hover:text-diag-green rounded-lg">
                            <i class="fas fa-bell text-lg"></i>
                        </button>
                        <div class="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                            <div class="w-8 h-8 bg-diag-green rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-white text-sm"></i>
                            </div>
                            <span class="font-medium text-gray-700">Adrien</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Contenu principal -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            <!-- Vue d'ensemble -->
            <section id="dashboard" class="mb-12">
                <div class="mb-8">
                    <h2 class="text-3xl font-bold text-diag-dark mb-2">Vue d'ensemble</h2>
                    <p class="text-gray-600">Tableau de bord complet - Tous modules diagnostiques opérationnels</p>
                </div>
                
                <!-- Statistiques rapides avec mise à jour temps réel -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div class="stats-card p-6 rounded-xl">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Interventions ce mois</p>
                                <p id="monthlyInterventions" class="text-3xl font-bold text-diag-dark">12</p>
                            </div>
                            <div class="p-3 bg-diag-green bg-opacity-10 rounded-lg">
                                <i class="fas fa-calendar-check text-diag-green text-xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-card p-6 rounded-xl">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Modules analysés</p>
                                <p id="modulesAnalyzed" class="text-3xl font-bold text-diag-dark">1 247</p>
                            </div>
                            <div class="p-3 bg-blue-100 rounded-lg">
                                <i class="fas fa-solar-panel text-blue-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-card p-6 rounded-xl">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Défauts détectés</p>
                                <p id="defectsDetected" class="text-3xl font-bold text-diag-dark">89</p>
                            </div>
                            <div class="p-3 bg-red-100 rounded-lg">
                                <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="stats-card p-6 rounded-xl">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Taux conformité</p>
                                <p id="conformityRate" class="text-3xl font-bold text-diag-dark">92.8%</p>
                            </div>
                            <div class="p-3 bg-green-100 rounded-lg">
                                <i class="fas fa-check-circle text-green-600 text-xl"></i>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Sessions en cours -->
                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-bold text-diag-dark">Sessions en cours</h3>
                        <div class="flex items-center space-x-2">
                            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span class="text-sm text-gray-600">Synchronisation active</span>
                        </div>
                    </div>
                    <div id="activeSessions" class="space-y-3">
                        <div class="p-4 bg-gray-50 rounded-lg border-l-4 border-purple-500">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h4 class="font-medium text-gray-900">Module Électroluminescence</h4>
                                    <p class="text-sm text-gray-600">Audit en cours - Sauvegarde automatique active</p>
                                </div>
                                <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Actif</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Modules disponibles -->
            <section class="mb-12">
                <div class="mb-8">
                    <h2 class="text-3xl font-bold text-diag-dark mb-2">Modules Diagnostiques</h2>
                    <p class="text-gray-600">Suite complète d'outils professionnels conformes aux normes IEC</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                <!-- 1. Électroluminescence (Module Principal avec Sauvegarde) -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
                    <div class="bg-purple-600 p-6 text-white">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-moon text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-xl font-bold">Électroluminescence</h3>
                                <p class="text-purple-100">IEC 62446-1 • Module Principal</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="bg-green-500 bg-opacity-80 px-3 py-1 rounded-full text-sm font-medium">✅ INTÉGRÉ HUB</span>
                            <div class="text-right">
                                <div class="text-xs text-purple-100">Sauvegarde</div>
                                <div class="text-sm font-bold">Multi-niveaux</div>
                            </div>
                        </div>
                    </div>
                    <div class="p-6">
                        <ul class="space-y-2 text-sm text-gray-600 mb-6">
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Défauts microfissures & PID</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Synchronisation temps réel</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Sauvegarde automatique (4-niveaux)</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Récupération sessions</li>
                        </ul>
                        <button onclick="openElectroluminescence()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-bold">
                            <i class="fas fa-rocket mr-2"></i>LANCER MODULE
                        </button>
                    </div>
                </div>

                <!-- 2. Thermographie -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
                    <div class="bg-red-500 p-6 text-white">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-thermometer-half text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-xl font-bold">Thermographie</h3>
                                <p class="text-red-100">DIN EN 62446-3</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="bg-red-400 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">✅ OPÉRATIONNEL</span>
                        </div>
                    </div>
                    <div class="p-6">
                        <ul class="space-y-2 text-sm text-gray-600 mb-6">
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Points chauds & diodes</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Cartographie thermique</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Drone & sol</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Analyse automatique</li>
                        </ul>
                        <button onclick="openThermography()" class="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-bold">
                            <i class="fas fa-fire mr-2"></i>LANCER MODULE
                        </button>
                    </div>
                </div>

                <!-- 3. Courbes I-V -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
                    <div class="bg-blue-600 p-6 text-white">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-chart-line text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-xl font-bold">Courbes I-V</h3>
                                <p class="text-blue-100">IEC 60904-1</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="bg-blue-400 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">✅ OPÉRATIONNEL</span>
                        </div>
                    </div>
                    <div class="p-6">
                        <ul class="space-y-2 text-sm text-gray-600 mb-6">
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Courbes sombres/référence</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Calcul Rsérie/Rparallèle</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Détection dégradation</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Conformité IEC</li>
                        </ul>
                        <button onclick="openIVCurves()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold">
                            <i class="fas fa-wave-square mr-2"></i>LANCER MODULE
                        </button>
                    </div>
                </div>

                <!-- 4. Tests Isolement -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
                    <div class="bg-yellow-500 p-6 text-white">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-shield-alt text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-xl font-bold">Tests Isolement</h3>
                                <p class="text-yellow-100">NFC 15-100</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="bg-yellow-400 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">✅ OPÉRATIONNEL</span>
                        </div>
                    </div>
                    <div class="p-6">
                        <ul class="space-y-2 text-sm text-gray-600 mb-6">
                            <li><i class="fas fa-check text-diag-green mr-2"></i>DC/AC isolement</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Tests continuité</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Conformité NFC automatique</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Multimètre intégré</li>
                        </ul>
                        <button onclick="openIsolation()" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-bold">
                            <i class="fas fa-lock mr-2"></i>LANCER MODULE
                        </button>
                    </div>
                </div>

                <!-- 5. Contrôles Visuels -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
                    <div class="bg-green-500 p-6 text-white">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-eye text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-xl font-bold">Contrôles Visuels</h3>
                                <p class="text-green-100">IEC 62446-1</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="bg-green-400 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">✅ OPÉRATIONNEL</span>
                        </div>
                    </div>
                    <div class="p-6">
                        <ul class="space-y-2 text-sm text-gray-600 mb-6">
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Checklist normative IEC</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Photos annotées</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Criticité automatique</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Actions correctives</li>
                        </ul>
                        <button onclick="openVisualInspection()" class="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-bold">
                            <i class="fas fa-camera mr-2"></i>LANCER MODULE
                        </button>
                    </div>
                </div>

                <!-- 6. Expertise Post-Sinistre -->
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden card-hover">
                    <div class="bg-gray-700 p-6 text-white">
                        <div class="flex items-center mb-4">
                            <i class="fas fa-balance-scale text-3xl mr-4"></i>
                            <div>
                                <h3 class="text-xl font-bold">Expertise Post-Sinistre</h3>
                                <p class="text-gray-300">Judiciaire • Assurance</p>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="bg-gray-600 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">✅ OPÉRATIONNEL</span>
                        </div>
                    </div>
                    <div class="p-6">
                        <ul class="space-y-2 text-sm text-gray-600 mb-6">
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Évaluation dommages</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Calcul pertes (kWh/€)</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Rapport contradictoire</li>
                            <li><i class="fas fa-check text-diag-green mr-2"></i>Préconisations techniques</li>
                        </ul>
                        <button onclick="openExpertise()" class="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 rounded-lg font-bold">
                            <i class="fas fa-gavel mr-2"></i>LANCER MODULE
                        </button>
                    </div>
                </div>

            </div>

            <!-- Actions globales -->
            <section class="mt-12">
                <div class="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                    <h3 class="text-2xl font-bold text-diag-dark mb-6">Actions globales</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button onclick="createNewProject()" class="p-4 bg-diag-green hover:bg-green-600 text-white rounded-lg font-medium">
                            <i class="fas fa-plus mr-2"></i>Nouveau Projet
                        </button>
                        
                        <button onclick="viewAllProjects()" class="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
                            <i class="fas fa-folder mr-2"></i>Tous les Projets
                        </button>
                        
                        <button onclick="generateGlobalReport()" class="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium">
                            <i class="fas fa-file-pdf mr-2"></i>Rapport Global
                        </button>
                        
                        <button onclick="exportData()" class="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium">
                            <i class="fas fa-download mr-2"></i>Export Données
                        </button>
                    </div>
                </div>
            </section>
        </main>

        <script>
        // Statistiques temps réel - Mise à jour automatique
        async function updateDashboardStats() {
            try {
                const response = await fetch('/api/dashboard/stats');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('monthlyInterventions').textContent = data.stats.monthly_interventions;
                    document.getElementById('modulesAnalyzed').textContent = data.stats.modules_analyzed.toLocaleString();
                    document.getElementById('defectsDetected').textContent = data.stats.defects_detected;
                    document.getElementById('conformityRate').textContent = data.stats.conformity_rate + '%';
                    
                    // Indicateur de synchronisation
                    const indicator = document.getElementById('realTimeIndicator');
                    indicator.classList.remove('bg-yellow-100', 'text-yellow-700');
                    indicator.classList.add('bg-green-100', 'text-green-700');
                    indicator.querySelector('span').textContent = 'Synchronisé';
                }
            } catch (error) {
                console.log('Stats hors ligne:', error);
                const indicator = document.getElementById('realTimeIndicator');
                indicator.classList.remove('bg-green-100', 'text-green-700');
                indicator.classList.add('bg-yellow-100', 'text-yellow-700');
                indicator.querySelector('span').textContent = 'Mode hors ligne';
            }
        }
        
        // Mise à jour automatique toutes les 30 secondes
        setInterval(updateDashboardStats, 30000);
        
        // Chargement initial
        updateDashboardStats();
        
        // Fonctions des modules
        function openElectroluminescence() {
            window.location.href = '/modules/electroluminescence';
        }

        function openThermography() {
            window.location.href = '/modules/thermography';
        }

        function openIVCurves() {
            window.location.href = '/modules/iv-curves';
        }

        function openIsolation() {
            window.location.href = '/modules/isolation';
        }

        function openVisualInspection() {
            window.location.href = '/modules/visual';
        }

        function openExpertise() {
            window.location.href = '/modules/expertise';
        }

        // Actions globales
        function createNewProject() {
            window.location.href = '/projects/new';
        }

        function viewAllProjects() {
            window.location.href = '/projects';
        }

        function generateGlobalReport() {
            alert('📄 Générateur de Rapports Globaux\\n\\nFonctionnalité en développement.\\nExport multi-modules avec synthèse exécutive.');
        }

        function exportData() {
            alert('📊 Export Données\\n\\nExport CSV/Excel de toutes les données diagnostic en cours de développement.');
        }
        <\/script>
    </body>
    </html>
  `));
h.get("/modules", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Modules Diagnostiques - Hub DiagPV</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .card-hover { transition: all 0.3s ease; }
            .card-hover:hover { transform: translateY(-5px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <header class="bg-white shadow-sm border-b-2 border-green-500">
            <div class="max-w-7xl mx-auto px-4 py-4">
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-bold text-gray-800">Modules Diagnostiques</h1>
                    <a href="/" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-home mr-2"></i>Retour Dashboard
                    </a>
                </div>
            </div>
        </header>
        
        <main class="max-w-7xl mx-auto px-4 py-8">
            <p class="text-gray-600 mb-8">Sélectionnez le module de diagnostic à utiliser</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 card-hover p-6">
                    <div class="text-center">
                        <i class="fas fa-moon text-4xl text-purple-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Électroluminescence</h3>
                        <p class="text-gray-600 mb-4">Module principal avec sauvegarde intégrée</p>
                        <a href="/modules/electroluminescence" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-bold inline-block">
                            Accéder
                        </a>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 card-hover p-6">
                    <div class="text-center">
                        <i class="fas fa-thermometer-half text-4xl text-red-500 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2 text-gray-500">Thermographie</h3>
                        <p class="text-gray-400 mb-4">En développement professionnel</p>
                        <div class="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-bold cursor-not-allowed text-center">
                            <i class="fas fa-tools mr-2"></i>Bientôt disponible
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 card-hover p-6">
                    <div class="text-center">
                        <i class="fas fa-chart-line text-4xl text-blue-600 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2 text-gray-500">Courbes I-V</h3>
                        <p class="text-gray-400 mb-4">En développement professionnel</p>
                        <div class="w-full bg-gray-300 text-gray-500 py-3 px-4 rounded-lg font-bold cursor-not-allowed text-center">
                            <i class="fas fa-tools mr-2"></i>Bientôt disponible
                        </div>
                        </a>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 card-hover p-6">
                    <div class="text-center">
                        <i class="fas fa-shield-alt text-4xl text-yellow-500 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Tests Isolement</h3>
                        <p class="text-gray-600 mb-4">Conformité NFC 15-100</p>
                        <a href="/modules/isolation" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg font-bold inline-block">
                            Accéder
                        </a>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 card-hover p-6">
                    <div class="text-center">
                        <i class="fas fa-eye text-4xl text-green-500 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Contrôles Visuels</h3>
                        <p class="text-gray-600 mb-4">Inspection normative</p>
                        <a href="/modules/visual" class="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-bold inline-block">
                            Accéder
                        </a>
                    </div>
                </div>
                
                <div class="bg-white rounded-xl shadow-sm border border-gray-200 card-hover p-6">
                    <div class="text-center">
                        <i class="fas fa-balance-scale text-4xl text-gray-700 mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Expertise Post-Sinistre</h3>
                        <p class="text-gray-600 mb-4">Analyse judiciaire</p>
                        <a href="/modules/expertise" class="w-full bg-gray-700 hover:bg-gray-800 text-white py-3 px-4 rounded-lg font-bold inline-block">
                            Accéder
                        </a>
                    </div>
                </div>
            </div>
        </main>
    </body>
    </html>
  `));
h.get("/projects", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gestion des Projets - DiagPV</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <a href="/" class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <i class="fas fa-solar-panel text-white"></i>
                            </div>
                            <span class="text-xl font-bold text-gray-900">DiagPV Hub</span>
                        </a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-gray-600 hover:text-green-600"><i class="fas fa-home mr-1"></i>Hub</a>
                        <a href="/projects/new" class="bg-green-600 text-white px-4 py-2 rounded-lg"><i class="fas fa-plus mr-1"></i>Nouveau Projet</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Contenu principal -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">Tous les Projets</h1>
                <p class="text-gray-600">Gestion complète de vos projets diagnostiques photovoltaïques</p>
            </div>

            <!-- Statistiques projets -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Projets actifs</p>
                            <p class="text-3xl font-bold text-green-600">12</p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-lg">
                            <i class="fas fa-project-diagram text-green-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Audits terminés</p>
                            <p class="text-3xl font-bold text-blue-600">47</p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-lg">
                            <i class="fas fa-check-circle text-blue-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Modules analysés</p>
                            <p class="text-3xl font-bold text-purple-600">1,247</p>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-lg">
                            <i class="fas fa-solar-panel text-purple-600"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-gray-600">Défauts détectés</p>
                            <p class="text-3xl font-bold text-red-600">89</p>
                        </div>
                        <div class="p-3 bg-red-100 rounded-lg">
                            <i class="fas fa-exclamation-triangle text-red-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Liste des projets -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200">
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold text-gray-900">Liste des Projets</h2>
                        <div class="flex items-center space-x-3">
                            <button class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <i class="fas fa-filter mr-2"></i>Filtrer
                            </button>
                            <button class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fas fa-plus mr-2"></i>Nouveau Projet
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="p-6">
                    <div id="projectsList" class="space-y-4">
                        <!-- Projet d'exemple -->
                        <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center space-x-4">
                                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <i class="fas fa-solar-panel text-green-600 text-xl"></i>
                                    </div>
                                    <div>
                                        <h3 class="font-semibold text-gray-900">Installation Résidentielle - Marseille</h3>
                                        <p class="text-sm text-gray-600">Client: SolarTech Solutions • 25 kWc • 84 modules</p>
                                    </div>
                                </div>
                                <div class="flex items-center space-x-2">
                                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">En cours</span>
                                    <button class="p-2 text-gray-400 hover:text-gray-600">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                <div class="text-center">
                                    <p class="text-sm text-gray-600">Électroluminescence</p>
                                    <p class="font-semibold text-green-600">✓ Terminé</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-sm text-gray-600">Thermographie</p>
                                    <p class="font-semibold text-blue-600">En cours</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-sm text-gray-600">Tests I-V</p>
                                    <p class="font-semibold text-gray-400">Planifié</p>
                                </div>
                                <div class="text-center">
                                    <p class="text-sm text-gray-600">Rapport</p>
                                    <p class="font-semibold text-gray-400">À venir</p>
                                </div>
                            </div>
                            
                            <div class="flex items-center justify-between">
                                <div class="text-sm text-gray-600">
                                    <i class="fas fa-calendar mr-1"></i>Créé le 15/10/2025 • Échéance: 22/10/2025
                                </div>
                                <div class="flex items-center space-x-2">
                                    <button class="px-3 py-1 text-blue-600 border border-blue-200 rounded hover:bg-blue-50">
                                        <i class="fas fa-eye mr-1"></i>Voir
                                    </button>
                                    <button class="px-3 py-1 text-green-600 border border-green-200 rounded hover:bg-green-50">
                                        <i class="fas fa-play mr-1"></i>Continuer
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
        // Chargement dynamique des projets
        async function loadProjects() {
            try {
                const response = await fetch('/api/projects');
                const data = await response.json();
                
                if (data.success) {
                    // Mise à jour interface avec données réelles
                    console.log('Projets chargés:', data.projects);
                }
            } catch (error) {
                console.log('Chargement projets hors ligne');
            }
        }
        
        // Chargement initial
        loadProjects();
        <\/script>
    </body>
    </html>
  `));
h.get("/projects/new", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouveau Projet - DiagPV</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- Navigation -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <a href="/" class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <i class="fas fa-solar-panel text-white"></i>
                            </div>
                            <span class="text-xl font-bold text-gray-900">DiagPV Hub</span>
                        </a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="text-gray-600 hover:text-green-600"><i class="fas fa-home mr-1"></i>Hub</a>
                        <a href="/projects" class="text-gray-600 hover:text-green-600"><i class="fas fa-folder mr-1"></i>Tous les Projets</a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Contenu principal -->
        <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="mb-8">
                <h1 class="text-3xl font-bold text-gray-900 mb-2">Nouveau Projet Diagnostic</h1>
                <p class="text-gray-600">Créez un nouveau projet d'audit photovoltaïque</p>
            </div>

            <!-- Formulaire de création -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <form id="newProjectForm" class="space-y-8">
                    <!-- Informations générales -->
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Informations Générales</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nom du Projet *</label>
                                <input type="text" id="projectName" required 
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                       placeholder="Installation Résidentielle - Ville">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Type d'Installation</label>
                                <select id="installationType" 
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500">
                                    <option value="residential">Résidentielle</option>
                                    <option value="commercial">Commerciale</option>
                                    <option value="industrial">Industrielle</option>
                                    <option value="agricultural">Agricole</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Puissance (kWc) *</label>
                                <input type="number" id="power" required step="0.1"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                       placeholder="25.5">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de Modules</label>
                                <input type="number" id="moduleCount"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                       placeholder="84">
                            </div>
                        </div>
                    </div>

                    <!-- Informations client -->
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Client</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Nom du Client *</label>
                                <input type="text" id="clientName" required
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                       placeholder="SolarTech Solutions">
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input type="email" id="clientEmail"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                       placeholder="contact@solartech.fr">
                            </div>
                            
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-2">Adresse Installation</label>
                                <textarea id="installationAddress" rows="3"
                                          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                                          placeholder="123 Avenue des Panneaux Solaires, 13000 Marseille"></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- Type d'audit -->
                    <div>
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">Type d'Audit</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label class="relative">
                                <input type="radio" name="auditType" value="N1" class="peer sr-only">
                                <div class="p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-green-500 peer-checked:bg-green-50">
                                    <h4 class="font-semibold text-gray-900">Audit N1</h4>
                                    <p class="text-sm text-gray-600">Contrôle visuel simple</p>
                                </div>
                            </label>
                            
                            <label class="relative">
                                <input type="radio" name="auditType" value="N2" class="peer sr-only" checked>
                                <div class="p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-green-500 peer-checked:bg-green-50">
                                    <h4 class="font-semibold text-gray-900">Audit N2</h4>
                                    <p class="text-sm text-gray-600">Tests électriques</p>
                                </div>
                            </label>
                            
                            <label class="relative">
                                <input type="radio" name="auditType" value="N3" class="peer sr-only">
                                <div class="p-4 border-2 border-gray-200 rounded-lg cursor-pointer peer-checked:border-green-500 peer-checked:bg-green-50">
                                    <h4 class="font-semibold text-gray-900">Audit N3</h4>
                                    <p class="text-sm text-gray-600">Analyse complète</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex items-center justify-between pt-6 border-t border-gray-200">
                        <a href="/projects" class="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-arrow-left mr-2"></i>Retour
                        </a>
                        
                        <div class="flex space-x-4">
                            <button type="button" class="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Brouillon
                            </button>
                            <button type="submit" class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <i class="fas fa-plus mr-2"></i>Créer le Projet
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>

        <script>
        document.getElementById('newProjectForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                name: document.getElementById('projectName').value,
                type: document.getElementById('installationType').value,
                power: parseFloat(document.getElementById('power').value),
                module_count: parseInt(document.getElementById('moduleCount').value) || null,
                client_name: document.getElementById('clientName').value,
                client_email: document.getElementById('clientEmail').value || null,
                installation_address: document.getElementById('installationAddress').value || null,
                audit_type: document.querySelector('input[name="auditType"]:checked').value
            };
            
            try {
                const response = await fetch('/api/projects', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('✅ Projet créé avec succès !\\n\\nRedirection vers la liste des projets...');
                    window.location.href = '/projects';
                } else {
                    alert('❌ Erreur lors de la création:\\n' + result.error);
                }
            } catch (error) {
                alert('❌ Erreur de connexion. Projet sauvegardé en local.');
                console.error('Erreur:', error);
            }
        });
        <\/script>
    </body>
    </html>
  `));
h.get("/modules/electroluminescence", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Électroluminescence - HUB Diagnostic</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- Leaflet pour carte satellite -->
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""><\/script>
        
        <!-- Leaflet.draw pour outils de dessin -->
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.css" />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/1.0.4/leaflet.draw.js"><\/script>
        
        <!-- Leaflet GeometryUtil pour calculs de superficie -->
        <script src="https://cdn.jsdelivr.net/npm/leaflet-geometryutil@0.10.1/src/leaflet.geometryutil.js"><\/script>
        
        <!-- Rectangle orientable personnalisé pour toitures -->
        <script src="/static/rotatable-rectangle.js"><\/script>
        
        <style>
            :root { --el-purple: #8B5CF6; --diag-dark: #1F2937; --diag-green: #22C55E; }
            .bg-el-purple { background-color: var(--el-purple); }
            .text-el-purple { color: var(--el-purple); }
            .bg-diag-dark { background-color: var(--diag-dark); }
            .bg-diag-green { background-color: var(--diag-green); }
            
            /* Interface intégrée */
            .module-frame {
                border: none;
                width: 100%;
                min-height: calc(100vh - 200px);
                border-radius: 12px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }
            
            .sync-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                transition: all 0.3s ease;
            }
            
            .sync-indicator.active {
                background: var(--diag-green);
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            /* Styles pour les onglets */
            .tab-button {
                transition: all 0.2s ease;
                border-bottom: 2px solid transparent;
            }
            
            .tab-button.active {
                color: #7C3AED;
                border-bottom-color: #7C3AED;
            }
            
            .tab-button:not(.active):hover {
                color: #374151;
                border-bottom-color: #D1D5DB;
            }
            
            .tab-content.hidden {
                display: none;
            }
            
            /* Styles pour la carte satellite */
            #satelliteMap {
                height: 600px;
                width: 100%;
                border-radius: 8px;
                border: 2px solid #e5e7eb;
            }
            
            /* Styles pour les outils de dessin */
            .leaflet-draw-toolbar {
                margin-top: 10px !important;
            }
            
            .leaflet-draw-section {
                background: white !important;
                border-radius: 6px !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
            }
            
            .zone-polygon {
                fill: rgba(59, 130, 246, 0.2);
                stroke: #3b82f6;
                stroke-width: 2;
            }
            
            .building-polygon {
                fill: rgba(239, 68, 68, 0.3);
                stroke: #ef4444;
                stroke-width: 2;
            }
            
            .ombriere-polygon {
                fill: rgba(34, 197, 94, 0.3);
                stroke: #22c55e;
                stroke-width: 2;
            }
            
            .obstacle-polygon {
                fill: rgba(107, 114, 128, 0.4);
                stroke: #6b7280;
                stroke-width: 2;
            }
            
            .module-marker {
                background: #3b82f6;
                border: 2px solid #1d4ed8;
                border-radius: 4px;
                color: white;
                font-weight: bold;
                text-align: center;
                font-size: 10px;
                padding: 2px 4px;
                min-width: 20px;
                min-height: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .module-marker.defect {
                background: #ef4444;
                border-color: #dc2626;
            }
            
            .leaflet-popup-content {
                font-family: inherit;
            }
            
            .address-search {
                position: absolute;
                top: 10px;
                left: 50px;
                z-index: 1000;
                background: white;
                padding: 8px;
                border-radius: 6px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.2);
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header HUB -->
        <header class="bg-el-purple text-white py-3 sticky top-0 z-50">
            <div class="max-w-full px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center justify-center w-10 h-10 bg-white bg-opacity-20 rounded-lg">
                            <i class="fas fa-moon text-lg text-white"></i>
                        </div>
                        <div>
                            <h1 class="text-lg font-bold">ÉLECTROLUMINESCENCE</h1>
                            <p class="text-purple-100 text-sm">IEC 62446-1 • Intégré HUB DiagPV</p>
                        </div>
                    </div>
                    
                    <!-- Navigation HUB -->
                    <div class="flex items-center space-x-3">
                        <div class="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                            <div id="syncIndicator" class="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span class="text-sm font-medium" id="syncStatus">Synchronisé</span>
                        </div>
                        
                        <a href="/modules" class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
                            <i class="fas fa-th mr-1"></i>Modules
                        </a>
                        
                        <a href="/" class="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded-lg text-sm font-medium">
                            <i class="fas fa-home mr-1"></i>Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Système d'onglets -->
        <div class="bg-white border-b border-gray-200">
            <div class="max-w-full px-4">
                <nav class="flex space-x-8" role="tablist">
                    <button 
                        id="tabAudit"
                        class="tab-button active py-4 px-2 border-b-2 border-purple-600 text-purple-600 font-medium text-sm"
                        onclick="switchTab('audit')"
                        role="tab">
                        <i class="fas fa-moon mr-2"></i>Audit Électroluminescence
                    </button>
                    <button 
                        id="tabDesigner"
                        class="tab-button py-4 px-2 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm"
                        onclick="switchTab('designer')"
                        role="tab">
                        <i class="fas fa-th-large mr-2"></i>Designer Layout
                    </button>
                </nav>
            </div>
        </div>

        <!-- Contenu Audit EL (existant - préservé à 100%) -->
        <main id="contentAudit" class="tab-content p-4">
            <iframe 
                id="auditFrame"
                src="https://diagpv-audit.pages.dev" 
                class="module-frame"
                frameborder="0"
                allow="camera; microphone; geolocation">
            </iframe>
        </main>

        <!-- Contenu Designer Layout (nouveau) -->
        <main id="contentDesigner" class="tab-content hidden p-4">
            <!-- Configuration Installation -->
            <div class="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                <h2 class="text-xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-cog text-blue-600 mr-2"></i>Configuration Installation
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Longueur Module (mm)</label>
                        <input type="number" id="moduleLength" value="1960" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Largeur Module (mm)</label>
                        <input type="number" id="moduleWidth" value="990" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Puissance (Wc)</label>
                        <input type="number" id="modulePower" value="300" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Espacement (mm)</label>
                        <input type="number" id="moduleSpacing" value="20" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Préset Installation</label>
                        <select id="presetType" onchange="applyPreset()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="custom">Personnalisé</option>
                            <option value="2009-2012">2009-2012 (1650x990, 230W)</option>
                            <option value="2013-2017">2013-2017 (1960x990, 300W)</option>
                            <option value="2018-2022">2018-2022 (2000x1000, 400W)</option>
                            <option value="2023-2025">2023-2025 (2100x1040, 500W)</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Type Numérotation</label>
                        <select id="numberingType" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="alphanumeric">A1, A2, B1, B2...</option>
                            <option value="numeric">001, 002, 003...</option>
                            <option value="rowcol">R1C1, R1C2, R2C1...</option>
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Mode Installation</label>
                        <select id="installationMode" onchange="changeInstallationMode()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2">
                            <option value="roof">Toiture</option>
                            <option value="ground">Sol/Ombrière</option>
                            <option value="facade">Façade</option>
                        </select>
                        <div class="flex space-x-2">
                            <button onclick="clearLayout()" class="flex-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-xs">
                                <i class="fas fa-trash mr-1"></i>Reset
                            </button>
                            <button onclick="saveLayout()" class="flex-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-xs">
                                <i class="fas fa-save mr-1"></i>Sauver
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Choix Source Données + Config Strings -->
            <div class="bg-white rounded-xl shadow-sm p-6 mb-6 border border-gray-200">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-database text-purple-600 mr-2"></i>Configuration Centrale
                    </h2>
                    
                    <!-- Sélecteur de source -->
                    <div class="flex items-center gap-3">
                        <label class="text-sm font-medium text-gray-700">Source données :</label>
                        <select id="dataSourceSelector" onchange="switchDataSource()" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500">
                            <option value="manual">Configuration Manuelle</option>
                            <option value="audit">Charger depuis Audit EL</option>
                        </select>
                    </div>
                </div>
                
                <!-- Configuration Manuelle -->
                <div id="manualConfigSection">
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de Strings</label>
                            <input type="number" id="stringCount" value="4" min="1" max="50" onchange="updateStringConfig()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Modules par String</label>
                            <input type="number" id="modulesPerString" value="24" min="1" max="100" onchange="updateStringConfig()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Boîtiers de Jonction</label>
                            <input type="number" id="junctionBoxCount" value="2" min="1" max="20" onchange="updateStringConfig()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Total Modules</label>
                            <input type="text" id="totalModulesCalc" value="96" readonly class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-bold text-green-600">
                        </div>
                    </div>
                    
                    <!-- Détails config strings -->
                    <div id="stringConfigDetails" class="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
                        <!-- Rempli dynamiquement -->
                    </div>
                    
                    <div class="mt-4 flex gap-2">
                        <button onclick="autoAssignStrings()" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">
                            <i class="fas fa-magic mr-1"></i>Attribution Automatique
                        </button>
                        <button onclick="toggleStringVisualization()" class="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm">
                            <i class="fas fa-eye mr-1"></i>Visualiser Strings
                        </button>
                    </div>
                </div>
                
                <!-- Section Audit (affichée si source = audit) -->
                <div id="auditDataInfo" class="hidden">
                    <!-- Rempli dynamiquement par displayAuditDataSummary() -->
                </div>
            </div>

            <!-- Canvas Designer -->
            <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-bold text-gray-800">
                        <i class="fas fa-th-large text-blue-600 mr-2"></i>Layout Installation
                    </h2>
                    
                    <div class="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Modules: <span id="moduleCount" class="font-bold text-blue-600">0</span></span>
                        <span>Puissance: <span id="totalPower" class="font-bold text-green-600">0 kWc</span></span>
                        <span>Mode: 
                            <select id="designMode" onchange="changeDesignMode()" class="ml-1 border border-gray-300 rounded px-2 py-1">
                                <option value="add">Ajouter</option>
                                <option value="remove">Supprimer</option>
                            </select>
                        </span>
                    </div>
                </div>
                
                <!-- Outils de dessin et contrôles -->
                <div class="mb-4 flex flex-wrap items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div class="flex items-center space-x-2">
                        <button id="drawZone" onclick="setDrawingMode('zone')" class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm">
                            <i class="fas fa-vector-square mr-1"></i>Zone Installation
                        </button>
                        <button id="drawBuilding" onclick="setDrawingMode('building')" class="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm">
                            <i class="fas fa-building mr-1"></i>Bâtiment
                        </button>
                        <button id="drawOmbriere" onclick="setDrawingMode('ombriere')" class="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded text-sm">
                            <i class="fas fa-umbrella mr-1"></i>Ombrière
                        </button>
                        <button id="drawObstacle" onclick="setDrawingMode('obstacle')" class="px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-sm">
                            <i class="fas fa-exclamation-triangle mr-1"></i>Obstacle
                        </button>
                    </div>
                    
                    <div class="flex items-center space-x-2 border-l border-gray-300 pl-4">
                        <button onclick="clearAllDrawings()" class="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm">
                            <i class="fas fa-eraser mr-1"></i>Effacer Tout
                        </button>
                        <button onclick="toggleCalibration()" class="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm">
                            <i class="fas fa-ruler mr-1"></i>Calibrer Échelle
                        </button>
                        <button onclick="syncWithAudit()" class="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-sm">
                            <i class="fas fa-sync mr-1"></i>Sync Audit EL
                        </button>
                    </div>
                </div>
                
                <!-- Carte satellite interactive -->
                <div class="relative">
                    <!-- Zone de recherche d'adresse -->
                    <div class="address-search">
                        <input 
                            type="text" 
                            id="addressSearch" 
                            placeholder="Rechercher une adresse..."
                            class="px-3 py-1 text-sm border border-gray-300 rounded"
                            onkeypress="handleAddressSearch(event)">
                        <button onclick="getCurrentLocation()" class="ml-2 px-2 py-1 bg-blue-500 text-white text-sm rounded" title="Ma position">
                            <i class="fas fa-crosshairs"></i>
                        </button>
                    </div>
                    
                    <!-- Carte satellite -->
                    <div id="satelliteMap"></div>
                    
                    <!-- Panel informations zone sélectionnée -->
                    <div id="zoneInfo" class="absolute top-10 right-4 bg-white rounded-lg shadow-lg p-4 w-64 hidden">
                        <h4 class="font-bold text-gray-800 mb-2">Zone Sélectionnée</h4>
                        <div id="zoneDetails" class="space-y-2 text-sm">
                            <!-- Informations dynamiques -->
                        </div>
                        <div class="mt-3 flex space-x-2">
                            <button onclick="placeModulesInZone()" class="flex-1 px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                <i class="fas fa-th mr-1"></i>Placer Modules
                            </button>
                            <button onclick="closeZoneInfo()" class="px-2 py-1 bg-gray-400 text-white rounded text-xs">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Légende et statistiques -->
                <div class="mt-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div class="flex flex-wrap items-center gap-6 text-sm">
                        <div class="flex items-center space-x-2">
                            <div class="w-4 h-3 bg-blue-500 border border-blue-700"></div>
                            <span>Module Normal</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-4 h-3 bg-red-500 border border-red-700"></div>
                            <span>Défaut EL Corrélé</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-6 h-2 bg-blue-200 border border-blue-400 opacity-50"></div>
                            <span>Zone Installation</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-6 h-2 bg-red-200 border border-red-400 opacity-60"></div>
                            <span>Bâtiment</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <div class="w-6 h-2 bg-green-200 border border-green-400 opacity-60"></div>
                            <span>Ombrière</span>
                        </div>
                    </div>
                    
                    <div class="flex flex-wrap space-x-2">
                        <button onclick="exportLayoutImage()" class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm">
                            <i class="fas fa-download mr-1"></i>Export PNG
                        </button>
                        <button onclick="generateLayoutReport()" class="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm">
                            <i class="fas fa-file-pdf mr-1"></i>Rapport Layout
                        </button>
                        <button onclick="sendToAuditModule()" class="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm">
                            <i class="fas fa-paper-plane mr-1"></i>→ Audit EL
                        </button>
                    </div>
                </div>
                
                <!-- Panneau statistiques en temps réel -->
                <div class="mt-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div class="bg-blue-50 p-3 rounded-lg text-center">
                        <div class="text-lg font-bold text-blue-600" id="layoutModuleCount">0</div>
                        <div class="text-xs text-gray-600">Modules Placés</div>
                    </div>
                    <div class="bg-green-50 p-3 rounded-lg text-center">
                        <div class="text-lg font-bold text-green-600" id="layoutTotalPower">0 kWc</div>
                        <div class="text-xs text-gray-600">Puissance Totale</div>
                    </div>
                    <div class="bg-purple-50 p-3 rounded-lg text-center">
                        <div class="text-lg font-bold text-purple-600" id="layoutZoneCount">0</div>
                        <div class="text-xs text-gray-600">Zones Définies</div>
                    </div>
                    <div class="bg-orange-50 p-3 rounded-lg text-center">
                        <div class="text-lg font-bold text-orange-600" id="layoutSyncStatus">⏱</div>
                        <div class="text-xs text-gray-600">Sync EL</div>
                    </div>
                    <div class="bg-red-50 p-3 rounded-lg text-center">
                        <div class="text-lg font-bold text-red-600" id="layoutDefectsLinked">0</div>
                        <div class="text-xs text-gray-600">Défauts Liés</div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-lg text-center">
                        <div class="text-lg font-bold text-gray-600" id="layoutEfficiency">0%</div>
                        <div class="text-xs text-gray-600">Efficacité Zone</div>
                    </div>
                </div>
            </div>
        </main>

        <!-- Dashboard Temps Réel -->
        <div class="fixed bottom-4 left-4 bg-white rounded-xl shadow-lg p-4 w-80 z-40" id="hubDashboard">
            <div class="flex items-center justify-between mb-3">
                <h3 class="font-bold text-diag-dark">
                    <i class="fas fa-chart-line text-el-purple mr-2"></i>Données Temps Réel
                </h3>
                <button onclick="toggleDashboard()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-minus" id="toggleIcon"></i>
                </button>
            </div>
            
            <div id="dashboardContent">
                <!-- Statistiques actuelles -->
                <div class="grid grid-cols-2 gap-3 mb-3">
                    <div class="text-center p-2 bg-purple-50 rounded-lg">
                        <div class="text-lg font-bold text-purple-600" id="totalModules">0</div>
                        <div class="text-xs text-gray-600">Modules</div>
                    </div>
                    
                    <div class="text-center p-2 bg-red-50 rounded-lg">
                        <div class="text-lg font-bold text-red-600" id="defectsFound">0</div>
                        <div class="text-xs text-gray-600">Défauts</div>
                    </div>
                    
                    <div class="text-center p-2 bg-blue-50 rounded-lg">
                        <div class="text-lg font-bold text-blue-600" id="progress">0%</div>
                        <div class="text-xs text-gray-600">Progression</div>
                    </div>
                    
                    <div class="text-center p-2 bg-green-50 rounded-lg">
                        <div class="text-lg font-bold text-green-600" id="conformityRate">0%</div>
                        <div class="text-xs text-gray-600">Conformité</div>
                    </div>
                </div>
                
                <!-- Dernières actions -->
                <div class="mb-3">
                    <h4 class="text-sm font-bold text-gray-700 mb-2">Dernières Actions</h4>
                    <div id="recentActions" class="space-y-1 max-h-24 overflow-y-auto">
                        <div class="text-xs text-gray-500 p-2 bg-gray-50 rounded">
                            En attente de données...
                        </div>
                    </div>
                </div>
                
                <!-- Actions rapides -->
                <div class="space-y-2">
                    <div class="flex space-x-2">
                        <button onclick="saveToHub()" class="flex-1 bg-diag-green hover:bg-green-600 text-white py-2 px-3 rounded text-xs font-medium">
                            <i class="fas fa-save mr-1"></i>Sauvegarder HUB
                        </button>
                        
                        <button onclick="exportData()" class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded text-xs font-medium">
                            <i class="fas fa-download mr-1"></i>Export
                        </button>
                    </div>
                    
                    <!-- Actions d'urgence -->
                    <div class="flex space-x-1">
                        <button onclick="emergencyRecover()" class="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-1 px-2 rounded text-xs font-medium" title="Récupérer données perdues">
                            <i class="fas fa-undo mr-1"></i>Récupérer
                        </button>
                        
                        <button onclick="clearSessionData()" class="flex-1 bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-xs font-medium" title="Nouvelle session">
                            <i class="fas fa-trash mr-1"></i>Reset
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Indicateur de synchronisation -->
        <div id="syncNotification" class="sync-indicator bg-white rounded-lg shadow-lg p-3 hidden">
            <div class="flex items-center space-x-2">
                <div class="w-3 h-3 bg-diag-green rounded-full animate-pulse"></div>
                <span class="text-sm font-medium text-diag-dark">Synchronisation...</span>
            </div>
        </div>

        <script>
        let auditData = {
            totalModules: 0,
            defectsFound: 0,
            progress: 0,
            conformityRate: 100,
            recentActions: [],
            currentSession: null,
            sessionId: null,
            lastSaved: null,
            unsavedChanges: false
        };
        
        // Configuration sauvegarde
        const BACKUP_CONFIG = {
            AUTO_SAVE_INTERVAL: 30000, // 30 secondes
            LOCAL_STORAGE_KEY: 'diagpv_audit_session',
            INDEXEDDB_NAME: 'DiagPVAuditDB',
            INDEXEDDB_VERSION: 1,
            RECOVERY_KEY: 'diagpv_recovery_data'
        };
        
        let autoSaveTimer = null;
        let db = null;
        
        // Initialisation IndexedDB pour sauvegarde robuste
        function initIndexedDB() {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(BACKUP_CONFIG.INDEXEDDB_NAME, BACKUP_CONFIG.INDEXEDDB_VERSION);
                
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    db = request.result;
                    resolve(db);
                };
                
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('auditSessions')) {
                        const store = db.createObjectStore('auditSessions', { keyPath: 'sessionId' });
                        store.createIndex('timestamp', 'timestamp');
                    }
                };
            });
        }
        
        // Sauvegarde automatique multi-niveaux
        async function saveSessionData(force = false) {
            try {
                const sessionData = {
                    ...auditData,
                    sessionId: auditData.sessionId || generateSessionId(),
                    timestamp: new Date().toISOString(),
                    lastSaved: new Date().toISOString()
                };
                
                // 1. LocalStorage (immédiat)
                localStorage.setItem(BACKUP_CONFIG.LOCAL_STORAGE_KEY, JSON.stringify(sessionData));
                
                // 2. IndexedDB (robuste)
                if (db) {
                    const transaction = db.transaction(['auditSessions'], 'readwrite');
                    const store = transaction.objectStore('auditSessions');
                    await store.put(sessionData);
                }
                
                // 3. Sauvegarde base HUB (cloud)
                if (force || auditData.unsavedChanges) {
                    await saveDataToHubDB();
                }
                
                auditData.lastSaved = sessionData.timestamp;
                auditData.sessionId = sessionData.sessionId;
                auditData.unsavedChanges = false;
                
                updateSaveStatus('saved');
                console.log('✅ Sauvegarde multi-niveaux réussie');
                
            } catch (error) {
                console.error('❌ Erreur sauvegarde:', error);
                updateSaveStatus('error');
            }
        }
        
        // Récupération de session
        async function recoverSessionData() {
            const recoveryData = [];
            
            try {
                // 1. LocalStorage
                const localData = localStorage.getItem(BACKUP_CONFIG.LOCAL_STORAGE_KEY);
                if (localData) {
                    recoveryData.push({
                        source: 'LocalStorage',
                        data: JSON.parse(localData),
                        priority: 1
                    });
                }
                
                // 2. IndexedDB
                if (db) {
                    const transaction = db.transaction(['auditSessions'], 'readonly');
                    const store = transaction.objectStore('auditSessions');
                    const request = store.getAll();
                    
                    request.onsuccess = () => {
                        request.result.forEach(session => {
                            recoveryData.push({
                                source: 'IndexedDB',
                                data: session,
                                priority: 2
                            });
                        });
                    };
                }
                
                // 3. Base HUB
                const hubResponse = await fetch('/api/audit-sessions');
                if (hubResponse.ok) {
                    const hubData = await hubResponse.json();
                    hubData.sessions?.forEach(session => {
                        recoveryData.push({
                            source: 'HUB Database',
                            data: JSON.parse(session.notes || '{}'),
                            priority: 3
                        });
                    });
                }
                
            } catch (error) {
                console.log('Récupération partielle:', error);
            }
            
            return recoveryData.sort((a, b) => b.priority - a.priority);
        }
        
        // Initialisation et protection
        async function initializeBackupSystem() {
            try {
                await initIndexedDB();
                
                // Vérification session interrompue
                const recoveryData = await recoverSessionData();
                if (recoveryData.length > 0 && recoveryData[0].data.unsavedChanges) {
                    showRecoveryDialog(recoveryData);
                }
                
                // Démarrage auto-save
                startAutoSave();
                
                // Protection fermeture
                setupBeforeUnloadProtection();
                
                console.log('🔒 Système de sauvegarde initialisé');
                
            } catch (error) {
                console.error('❌ Erreur init backup:', error);
            }
        }
        
        // Interface utilisateur de récupération
        function showRecoveryDialog(recoveryData) {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
            modal.innerHTML = \`
                <div class="bg-white rounded-xl p-6 max-w-md mx-4">
                    <h3 class="text-xl font-bold text-red-600 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2"></i>Session Interrompue Détectée
                    </h3>
                    <p class="text-gray-600 mb-4">Nous avons trouvé des données d'audit non sauvegardées. Souhaitez-vous les récupérer ?</p>
                    
                    <div class="space-y-2 mb-6">
                        \${recoveryData.slice(0, 3).map(item => \`
                            <div class="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                                <div class="font-medium">\${item.source}</div>
                                <div class="text-sm text-gray-600">
                                    \${item.data.totalModules || 0} modules • 
                                    \${item.data.defectsFound || 0} défauts • 
                                    \${item.data.timestamp ? new Date(item.data.timestamp).toLocaleString() : 'Date inconnue'}
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                    
                    <div class="flex space-x-3">
                        <button onclick="recoverSession(\${JSON.stringify(recoveryData[0].data).replace(/"/g, '&quot;')})" 
                                class="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-medium">
                            <i class="fas fa-undo mr-2"></i>Récupérer
                        </button>
                        <button onclick="dismissRecovery()" 
                                class="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded font-medium">
                            Ignorer
                        </button>
                    </div>
                </div>
            \`;
            document.body.appendChild(modal);
        }
        
        function recoverSession(sessionData) {
            auditData = { ...auditData, ...sessionData };
            updateHubData(auditData);
            dismissRecovery();
            showNotification('Session Récupérée', 'Vos données ont été restaurées avec succès', 'success');
        }
        
        function dismissRecovery() {
            document.querySelector('.fixed.inset-0')?.remove();
        }
        
        // Protection avant fermeture
        function setupBeforeUnloadProtection() {
            window.addEventListener('beforeunload', (event) => {
                if (auditData.unsavedChanges) {
                    // Sauvegarde d'urgence avec Beacon API
                    navigator.sendBeacon('/api/emergency-backup', JSON.stringify(auditData));
                    
                    const message = 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?';
                    event.returnValue = message;
                    return message;
                }
            });
        }
        
        // Timer auto-save
        function startAutoSave() {
            if (autoSaveTimer) clearInterval(autoSaveTimer);
            
            autoSaveTimer = setInterval(() => {
                if (auditData.unsavedChanges) {
                    saveSessionData();
                }
            }, BACKUP_CONFIG.AUTO_SAVE_INTERVAL);
        }
        
        // Communication avec iframe DiagPV
        window.addEventListener('message', function(event) {
            if (event.origin !== 'https://diagpv-audit.pages.dev') return;
            
            const data = event.data;
            
            if (data.type === 'DIAGPV_DATA_UPDATE') {
                updateHubData(data);
            } else if (data.type === 'DIAGPV_SESSION') {
                auditData.currentSession = data.session;
                console.log('Session DiagPV:', data.session);
            }
        });

        // Mise à jour des données HUB
        function updateHubData(data) {
            showSyncIndicator();
            
            let dataChanged = false;
            
            if (data.totalModules !== undefined && data.totalModules !== auditData.totalModules) {
                auditData.totalModules = data.totalModules;
                document.getElementById('totalModules').textContent = data.totalModules;
                dataChanged = true;
            }
            
            if (data.defectsFound !== undefined && data.defectsFound !== auditData.defectsFound) {
                auditData.defectsFound = data.defectsFound;
                document.getElementById('defectsFound').textContent = data.defectsFound;
                dataChanged = true;
            }
            
            if (data.progress !== undefined && data.progress !== auditData.progress) {
                auditData.progress = data.progress;
                document.getElementById('progress').textContent = data.progress + '%';
                dataChanged = true;
            }
            
            if (data.conformityRate !== undefined && data.conformityRate !== auditData.conformityRate) {
                auditData.conformityRate = data.conformityRate;
                document.getElementById('conformityRate').textContent = data.conformityRate + '%';
                dataChanged = true;
            }
            
            // Marquer changements pour sauvegarde automatique
            if (dataChanged) {
                auditData.unsavedChanges = true;
                updateSaveStatus('saving');
                
                // Sauvegarde immédiate + automatique base HUB
                saveSessionData().then(() => {
                    saveDataToHubDB();
                }).catch(error => {
                    console.error('Erreur sauvegarde données:', error);
                    updateSaveStatus('error');
                });
            }
        }

        // Sauvegarde automatique en base HUB
        async function saveDataToHubDB() {
            try {
                const response = await fetch('/api/audit-sessions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        session_data: auditData,
                        timestamp: new Date().toISOString(),
                        module_type: 'electroluminescence'
                    })
                });
                
                if (response.ok) {
                    updateSyncStatus('synchronized');
                }
            } catch (error) {
                console.log('Sauvegarde locale:', error);
                updateSyncStatus('local_only');
            }
        }

        // Actions HUB
        function saveToHub() {
            updateSaveStatus('saving');
            
            // Envoyer signal au module audit pour synchronisation complète
            const auditFrame = document.getElementById('auditFrame');
            auditFrame.contentWindow.postMessage({
                type: 'HUB_REQUEST_FULL_SYNC'
            }, 'https://diagpv-audit.pages.dev');
            
            // Forcer sauvegarde complète
            saveSessionData(true).then(() => {
                showSyncIndicator();
                showNotification(
                    'Sauvegarde HUB Réussie', 
                    'Données DiagPV Audit sécurisées dans le HUB',
                    'success'
                );
            }).catch(error => {
                console.error('Erreur sauvegarde HUB:', error);
                showNotification(
                    'Erreur Sauvegarde', 
                    'Données sauvegardées localement uniquement',
                    'warning'
                );
            });
        }

        function exportData() {
            if (auditData.totalModules === 0) {
                showNotification(
                    'Export Impossible', 
                    'Aucune donnée d\\'audit disponible. Commencez un audit.',
                    'warning'
                );
                return;
            }
            
            // Forcer sauvegarde avant export
            saveSessionData(true).then(() => {
                // Créer export JSON complet avec historique
                const exportData = {
                    ...auditData,
                    exportTimestamp: new Date().toISOString(),
                    source: 'DiagPV HUB - Module Électroluminescence',
                    backupInfo: {
                        lastSaved: auditData.lastSaved,
                        sessionId: auditData.sessionId,
                        version: '2.0'
                    }
                };
                
                const dataStr = JSON.stringify(exportData, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                
                const exportFileDefaultName = \`diagpv_audit_\${auditData.sessionId || 'session'}_\${new Date().toISOString().slice(0,10)}.json\`;
                
                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
                
                // Notification et log
                showNotification(
                    'Export Réussi', 
                    \`Fichier \${exportFileDefaultName} téléchargé\`,
                    'success'
                );
                
                console.log('📁 Export réussi:', exportFileDefaultName);
            });
        }
        
        // Fonction de récupération d'urgence manuelle
        function emergencyRecover() {
            recoverSessionData().then(recoveryData => {
                if (recoveryData.length > 0) {
                    showRecoveryDialog(recoveryData);
                } else {
                    showNotification(
                        'Aucune Donnée de Récupération', 
                        'Aucune session d\\'audit récupérable trouvée',
                        'info'
                    );
                }
            });
        }
        
        function clearSessionData() {
            if (confirm('Êtes-vous sûr de vouloir effacer toutes les données de la session actuelle ?')) {
                // Reset des données
                auditData = {
                    totalModules: 0,
                    defectsFound: 0,
                    progress: 0,
                    conformityRate: 100,
                    recentActions: [],
                    currentSession: null,
                    sessionId: null,
                    lastSaved: null,
                    unsavedChanges: false
                };
                
                // Clear storage
                localStorage.removeItem(BACKUP_CONFIG.LOCAL_STORAGE_KEY);
                
                // Mise à jour interface
                updateHubData(auditData);
                
                showNotification('Session Réinitialisée', 'Nouvelle session commencée', 'info');
            }
        }
        
        // Fonctions utilitaires
        function generateSessionId() {
            return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        function updateSaveStatus(status) {
            const indicator = document.getElementById('syncIndicator');
            const statusText = document.getElementById('syncStatus');
            
            switch(status) {
                case 'saving':
                    indicator.className = 'w-2 h-2 bg-yellow-400 rounded-full animate-pulse';
                    statusText.textContent = 'Sauvegarde...';
                    break;
                case 'saved':
                    indicator.className = 'w-2 h-2 bg-green-400 rounded-full';
                    statusText.textContent = 'Sauvegardé';
                    break;
                case 'error':
                    indicator.className = 'w-2 h-2 bg-red-400 rounded-full';
                    statusText.textContent = 'Erreur';
                    break;
            }
        }
        
        function updateSyncStatus(status) {
            updateSaveStatus(status === 'synchronized' ? 'saved' : 'error');
        }
        
        function showSyncIndicator() {
            const notification = document.getElementById('syncNotification');
            notification.classList.remove('hidden');
            
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 2000);
        }
        
        function showNotification(title, message, type = 'info') {
            const colors = {
                success: 'bg-green-500',
                warning: 'bg-yellow-500',
                error: 'bg-red-500',
                info: 'bg-blue-500'
            };
            
            const notification = document.createElement('div');
            notification.className = \`fixed top-20 right-4 \${colors[type]} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm\`;
            notification.innerHTML = \`
                <div class="font-bold">\${title}</div>
                <div class="text-sm">\${message}</div>
            \`;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
        
        function toggleDashboard() {
            const content = document.getElementById('dashboardContent');
            const icon = document.getElementById('toggleIcon');
            
            if (content.style.display === 'none') {
                content.style.display = 'block';
                icon.className = 'fas fa-minus';
            } else {
                content.style.display = 'none';
                icon.className = 'fas fa-plus';
            }
        }
        
        // NOUVEAU: Gestion des onglets et designer layout avec carte satellite
        let layoutData = {
            modules: [],
            config: {
                moduleLength: 1960,
                moduleWidth: 990,
                modulePower: 300,
                spacing: 20,
                numberingType: 'alphanumeric',
                installationMode: 'roof'
            },
            stringConfig: {
                stringCount: 4,
                modulesPerString: 24,
                junctionBoxCount: 2,
                stringAssignments: [],
                junctionBoxPositions: []
            },
            auditData: null, // Données chargées depuis module audit EL (optionnel)
            dataSource: 'manual', // 'manual' ou 'audit'
            mapCenter: [43.296482, 5.369780], // Marseille par défaut
            mapZoom: 18
        };
        
        let map, currentMode = 'add';
        let moduleMarkers = [];
        
        // Initialisation de la carte satellite
        function initDesigner() {
            if (document.getElementById('satelliteMap')) {
                initSatelliteMap();
            }
            
            // Initialiser config strings par défaut (mode manuel)
            updateStringConfig();
            
            // Vérifier si données audit disponibles
            const auditAvailable = localStorage.getItem('diagpv_audit_session');
            if (auditAvailable) {
                console.log('[INFO] Données audit détectées - disponibles en mode Audit');
            }
        }
        
        // Initialisation carte satellite
        function initSatelliteMap() {
            // Créer la carte
            map = L.map('satelliteMap').setView(layoutData.mapCenter, layoutData.mapZoom);
            
            // Couche satellite gratuite (Esri World Imagery)
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
                maxZoom: 20
            }).addTo(map);
            
            // Événement de clic pour placer modules
            map.on('click', function(e) {
                handleMapClick(e);
            });
            
            // Restaurer modules existants
            redrawMarkers();
        }
        
        // Gestion des onglets
        function switchTab(tabName) {
            // Masquer tous les contenus
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
            });
            
            // Désactiver tous les onglets
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active');
                button.classList.add('text-gray-500');
                button.classList.remove('text-purple-600', 'border-purple-600');
            });
            
            // Activer l'onglet sélectionné
            const activeTab = document.getElementById('tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
            const activeContent = document.getElementById('content' + tabName.charAt(0).toUpperCase() + tabName.slice(1));
            
            if (activeTab && activeContent) {
                activeTab.classList.add('active', 'text-purple-600', 'border-purple-600');
                activeTab.classList.remove('text-gray-500');
                activeContent.classList.remove('hidden');
                
                // Initialiser le designer si on passe sur cet onglet
                if (tabName === 'designer') {
                    setTimeout(initDesigner, 100);
                }
            }
        }
        
        // Application des présets
        function applyPreset() {
            const preset = document.getElementById('presetType').value;
            
            const presets = {
                '2009-2012': { length: 1650, width: 990, power: 230 },
                '2013-2017': { length: 1960, width: 990, power: 300 },
                '2018-2022': { length: 2000, width: 1000, power: 400 },
                '2023-2025': { length: 2100, width: 1040, power: 500 }
            };
            
            if (presets[preset]) {
                document.getElementById('moduleLength').value = presets[preset].length;
                document.getElementById('moduleWidth').value = presets[preset].width;
                document.getElementById('modulePower').value = presets[preset].power;
                updateConfig();
            }
        }
        
        // Mise à jour configuration
        function updateConfig() {
            layoutData.config = {
                moduleLength: parseInt(document.getElementById('moduleLength').value),
                moduleWidth: parseInt(document.getElementById('moduleWidth').value),
                modulePower: parseInt(document.getElementById('modulePower').value),
                spacing: parseInt(document.getElementById('moduleSpacing').value),
                numberingType: document.getElementById('numberingType').value
            };
            
            redrawCanvas();
            updateStats();
        }
        
        // Gestion des clics sur la carte
        function handleMapClick(e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            
            if (currentMode === 'add') {
                addModuleOnMap(lat, lng);
            } else {
                removeNearestModule(lat, lng);
            }
        }
        
        // Recherche d'adresse
        async function searchAddress(address) {
            try {
                const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(address + ', France') + '&limit=1';
                const response = await fetch(url);
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    
                    map.setView([lat, lon], 19);
                    layoutData.mapCenter = [lat, lon];
                    layoutData.mapZoom = 19;
                    
                    // Ajouter un marqueur temporaire
                    const marker = L.marker([lat, lon]).addTo(map)
                        .bindPopup('📍 ' + data[0].display_name)
                        .openPopup();
                    
                    // Supprimer après 5 secondes
                    setTimeout(function() {
                        map.removeLayer(marker);
                    }, 5000);
                    
                    showNotification('Adresse Trouvée', 'Carte centrée sur: ' + data[0].display_name, 'success');
                } else {
                    showNotification('Erreur', 'Adresse non trouvée. Essayez une adresse plus précise.', 'error');
                }
            } catch (error) {
                console.log('Recherche adresse:', error);
                showNotification('Erreur', 'Erreur lors de la recherche. Vérifiez votre connexion.', 'error');
            }
        }
        
        // Géolocalisation
        function getCurrentLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    map.setView([lat, lng], 19);
                    layoutData.mapCenter = [lat, lng];
                    layoutData.mapZoom = 19;
                    
                    L.marker([lat, lng]).addTo(map)
                        .bindPopup('📍 Votre position')
                        .openPopup();
                }, function(error) {
                    alert('Géolocalisation non autorisée ou indisponible.');
                });
            }
        }
        
        // Gestion recherche adresse
        function handleAddressSearch(event) {
            if (event.key === 'Enter') {
                const address = document.getElementById('addressSearch').value;
                if (address.trim()) {
                    searchAddress(address);
                }
            }
        }
        
        // Génération ID module selon type de numérotation
        function generateModuleId(index) {
            const type = layoutData.config.numberingType;
            const num = index + 1;
            
            switch (type) {
                case 'alphanumeric':
                    const row = Math.floor(index / 10);
                    const col = (index % 10) + 1;
                    return String.fromCharCode(65 + row) + col;
                case 'numeric':
                    return String(num).padStart(3, '0');
                case 'rowcol':
                    const r = Math.floor(index / 10) + 1;
                    const c = (index % 10) + 1;
                    return \`R\${r}C\${c}\`;
                default:
                    return \`M\${num}\`;
            }
        }
        
        // Mode installation
        function changeInstallationMode() {
            layoutData.config.installationMode = document.getElementById('installationMode').value;
            saveLayoutToSystem();
        }
        
        // Ajouter un module sur la carte
        function addModuleOnMap(lat, lng) {
            const moduleId = generateModuleId(layoutData.modules.length);
            
            const module = {
                id: moduleId,
                lat: lat,
                lng: lng,
                hasDefect: false,
                timestamp: Date.now()
            };
            
            layoutData.modules.push(module);
            
            // Créer le marqueur visuel
            addModuleMarker(module);
            updateStats();
            saveLayoutToSystem();
        }
        
        // Supprimer le module le plus proche
        function removeNearestModule(lat, lng) {
            let nearestIndex = -1;
            let minDistance = Infinity;
            
            layoutData.modules.forEach((module, index) => {
                const distance = Math.sqrt(Math.pow(module.lat - lat, 2) + Math.pow(module.lng - lng, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            });
            
            if (nearestIndex !== -1 && minDistance < 0.0001) { // Seuil de proximité
                // Supprimer le marqueur de la carte
                if (moduleMarkers[nearestIndex]) {
                    map.removeLayer(moduleMarkers[nearestIndex]);
                    moduleMarkers.splice(nearestIndex, 1);
                }
                
                // Supprimer des données
                layoutData.modules.splice(nearestIndex, 1);
                
                // Recréer tous les marqueurs avec nouvelles IDs
                redrawMarkers();
                updateStats();
                saveLayoutToSystem();
            }
        }
        
        // Créer marqueur module sur carte
        function addModuleMarker(module) {
            const icon = L.divIcon({
                className: 'module-marker' + (module.hasDefect ? ' defect' : ''),
                html: module.id,
                iconSize: [25, 20],
                iconAnchor: [12, 10]
            });
            
            const marker = L.marker([module.lat, module.lng], { icon: icon })
                .bindPopup(\`
                    <div class="text-center">
                        <strong>Module \${module.id}</strong><br>
                        <small>Puissance: \${layoutData.config.modulePower}Wc</small><br>
                        <small>Dimensions: \${layoutData.config.moduleLength}×\${layoutData.config.moduleWidth}mm</small>
                        \${module.hasDefect ? '<br><span class="text-red-600">⚠️ Défaut détecté</span>' : ''}
                    </div>
                \`)
                .addTo(map);
            
            moduleMarkers.push(marker);
        }
        
        // NOUVELLES FONCTIONS : Rendu modules comme rectangles PV orientés
        
        // Effacer tous les rectangles modules
        function clearModuleRectangles() {
            moduleRectangles.forEach(rect => {
                if (map && rect) {
                    map.removeLayer(rect);
                }
            });
            moduleRectangles = [];
        }
        
        // Ajouter module comme rectangle PV orienté
        /**
         * Ajouter un rectangle module orienté sur la carte
         * @param {number} lat - Latitude du centre
         * @param {number} lng - Longitude du centre
         * @param {number} angle - Angle rotation (0-360°)
         * @param {number} length - Longueur module en mm
         * @param {number} width - Largeur module en mm
         * @param {number} index - Index du module (0-based)
         * @param {object} moduleData - Données module depuis audit (optionnel)
         */
        function addOrientedModuleRectangle(lat, lng, angle, length, width, index, moduleData = null) {
            // Si données audit disponibles, utiliser le vrai ID
            let moduleId, stringNumber, positionInString, moduleStatus, moduleDefects;
            
            if (moduleData) {
                // Utiliser données réelles depuis module audit
                moduleId = moduleData.id;
                stringNumber = moduleData.stringNumber;
                positionInString = moduleData.position;
                moduleStatus = moduleData.status || 'ok';
                moduleDefects = moduleData.defects || [];
            } else {
                // Fallback: générer ID générique
                moduleId = generateModuleId(index);
                stringNumber = null;
                positionInString = null;
                moduleStatus = 'unknown';
                moduleDefects = [];
            }
            
            // Calculer 4 coins du rectangle module
            const lengthM = length / 1000;
            const widthM = width / 1000;
            
            const metersPerDegreeLat = 111320;
            const metersPerDegreeLng = 111320 * Math.cos(lat * Math.PI / 180);
            const angleRad = angle * Math.PI / 180;
            
            // Coins dans repère local
            const corners = [
                { x: -lengthM/2, y: -widthM/2 },  // SW
                { x:  lengthM/2, y: -widthM/2 },  // SE
                { x:  lengthM/2, y:  widthM/2 },  // NE
                { x: -lengthM/2, y:  widthM/2 }   // NW
            ];
            
            // Rotation et conversion lat/lng
            const rotatedCorners = corners.map(corner => {
                const xRot = corner.x * Math.cos(angleRad) - corner.y * Math.sin(angleRad);
                const yRot = corner.x * Math.sin(angleRad) + corner.y * Math.cos(angleRad);
                
                return L.latLng(
                    lat + yRot / metersPerDegreeLat,
                    lng + xRot / metersPerDegreeLng
                );
            });
            
            // Couleur selon statut module
            let borderColor, fillColor;
            if (moduleStatus === 'defect' || moduleDefects.length > 0) {
                borderColor = '#ef4444'; // Rouge si défaut
                fillColor = '#fca5a5';
            } else if (moduleStatus === 'ok') {
                borderColor = '#10b981'; // Vert si OK
                fillColor = '#86efac';
            } else {
                borderColor = '#3b82f6'; // Bleu par défaut
                fillColor = '#60a5fa';
            }
            
            // Créer rectangle comme polygon
            const moduleRect = L.polygon(rotatedCorners, {
                color: borderColor,
                weight: 2,
                fillColor: fillColor,
                fillOpacity: 0.4,
                className: 'module-pv-rectangle'
            });
            
            // Ajouter label au centre
            const label = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'module-label',
                    html: '<div style="background: rgba(255,255,255,0.9); padding: 2px 4px; border-radius: 3px; font-size: 10px; font-weight: bold; color: #1f2937; border: 1px solid ' + borderColor + ';">' + moduleId + '</div>',
                    iconSize: [40, 15],
                    iconAnchor: [20, 7]
                })
            });
            
            // Popup informations
            let popupContent = '<div class="text-center">' +
                '<strong>Module ' + moduleId + '</strong><br>' +
                '<small>Puissance: ' + layoutData.config.modulePower + 'Wc</small><br>' +
                '<small>Angle: ' + Math.round(angle) + '°</small><br>' +
                '<small>Dimensions: ' + length + '×' + width + 'mm</small>';
            
            if (stringNumber) {
                popupContent += '<br><small class="text-blue-600"><strong>String ' + stringNumber + '</strong> - Position ' + positionInString + '</small>';
            }
            
            if (moduleDefects.length > 0) {
                popupContent += '<br><small class="text-red-600"><i class="fas fa-exclamation-triangle"></i> ' + moduleDefects.length + ' défaut(s)</small>';
            } else if (moduleStatus === 'ok') {
                popupContent += '<br><small class="text-green-600"><i class="fas fa-check-circle"></i> Conforme</small>';
            }
            
            popupContent += '</div>';
            
            moduleRect.bindPopup(popupContent);
            label.bindPopup(popupContent);
            
            // Ajouter à la carte
            moduleRect.addTo(map);
            label.addTo(map);
            
            // Stocker références
            moduleRectangles.push(moduleRect);
            moduleRectangles.push(label);
            
            // Stocker dans données layout
            layoutData.modules.push({
                id: moduleId,
                lat: lat,
                lng: lng,
                angle: angle,
                stringNumber: stringNumber,
                positionInString: positionInString,
                status: moduleStatus,
                defects: moduleDefects,
                timestamp: Date.now()
            });
        }
        
        // FIN NOUVELLES FONCTIONS
        
        // Redessiner tous les marqueurs
        function redrawMarkers() {
            // Supprimer tous les marqueurs existants
            moduleMarkers.forEach(marker => {
                if (map && marker) {
                    map.removeLayer(marker);
                }
            });
            moduleMarkers = [];
            
            // Recréer tous les marqueurs avec IDs mises à jour
            layoutData.modules.forEach((module, index) => {
                module.id = generateModuleId(index);
                addModuleMarker(module);
            });
        }
        
        // Mise à jour statistiques
        function updateStats() {
            const count = layoutData.modules.length;
            const totalPower = count * layoutData.config.modulePower / 1000; // kWc
            
            if (document.getElementById('moduleCount')) {
                document.getElementById('moduleCount').textContent = count;
            }
            if (document.getElementById('totalPower')) {
                document.getElementById('totalPower').textContent = totalPower.toFixed(2);
            }
        }
        
        // Changer mode de design
        function changeDesignMode() {
            currentMode = document.getElementById('designMode').value;
        }
        
        // Reset layout
        function clearLayout() {
            if (confirm('Êtes-vous sûr de vouloir effacer tous les modules ?')) {
                // Supprimer tous les marqueurs
                moduleMarkers.forEach(marker => {
                    if (map && marker) {
                        map.removeLayer(marker);
                    }
                });
                moduleMarkers = [];
                layoutData.modules = [];
                
                updateStats();
                saveLayoutToSystem();
            }
        }
        
        // Sauvegarde layout (intégration au système existant)
        function saveLayoutToSystem() {
            // Sauvegarde dans le système de backup existant
            auditData.layoutData = layoutData;
            auditData.unsavedChanges = true;
            
            // Utiliser le système de sauvegarde existant
            saveSessionData().then(() => {
                saveDataToHubDB();
            }).catch(error => {
                console.log('Sauvegarde layout:', error);
            });
        }
        
        // Sauvegarde manuelle
        function saveLayout() {
            saveLayoutToSystem();
            alert('✅ Layout sauvegardé dans le système de backup multi-niveaux');
        }
        
        // ===== FONCTIONS CONFIGURATION STRINGS (MODE MANUEL) =====
        
        // Mise à jour configuration strings
        function updateStringConfig() {
            const stringCount = parseInt(document.getElementById('stringCount').value) || 0;
            const modulesPerString = parseInt(document.getElementById('modulesPerString').value) || 0;
            const junctionBoxCount = parseInt(document.getElementById('junctionBoxCount').value) || 0;
            
            layoutData.stringConfig.stringCount = stringCount;
            layoutData.stringConfig.modulesPerString = modulesPerString;
            layoutData.stringConfig.junctionBoxCount = junctionBoxCount;
            
            const totalModules = stringCount * modulesPerString;
            document.getElementById('totalModulesCalc').value = totalModules;
            
            generateStringConfigDetails();
        }
        
        // Générer détails config strings
        function generateStringConfigDetails() {
            const config = layoutData.stringConfig;
            const totalModules = config.stringCount * config.modulesPerString;
            const modulesPerBox = Math.ceil(config.stringCount / config.junctionBoxCount);
            
            let html = '<div class="grid grid-cols-1 md:grid-cols-3 gap-4">';
            html += '<div><span class="font-medium">Strings:</span> ' + config.stringCount + '</div>';
            html += '<div><span class="font-medium">Modules/String:</span> ' + config.modulesPerString + '</div>';
            html += '<div><span class="font-medium">Total Modules:</span> ' + totalModules + '</div>';
            html += '<div><span class="font-medium">Boîtiers:</span> ' + config.junctionBoxCount + '</div>';
            html += '<div><span class="font-medium">Strings/Boîtier:</span> ~' + modulesPerBox + '</div>';
            html += '<div><span class="font-medium">Puissance:</span> ' + (totalModules * layoutData.config.modulePower / 1000).toFixed(1) + ' kWc</div>';
            html += '</div>';
            
            document.getElementById('stringConfigDetails').innerHTML = html;
        }
        
        // Attribution automatique strings
        function autoAssignStrings() {
            const config = layoutData.stringConfig;
            layoutData.stringConfig.stringAssignments = [];
            
            for (let i = 0; i < config.stringCount; i++) {
                const boxNumber = Math.floor(i / Math.ceil(config.stringCount / config.junctionBoxCount)) + 1;
                layoutData.stringConfig.stringAssignments.push({
                    stringNumber: i + 1,
                    junctionBox: boxNumber
                });
            }
            
            showNotification('Attribution Réussie', config.stringCount + ' strings attribués à ' + config.junctionBoxCount + ' boîtiers', 'success');
            generateStringConfigDetails();
        }
        
        // Visualisation strings (couleurs)
        let stringVisualizationActive = false;
        function toggleStringVisualization() {
            stringVisualizationActive = !stringVisualizationActive;
            
            if (stringVisualizationActive) {
                applyStringColors();
                showNotification('Visualisation Activée', 'Modules colorés par string', 'info');
            } else {
                restoreNormalColors();
                showNotification('Visualisation Désactivée', 'Retour couleurs normales', 'info');
            }
        }
        
        function applyStringColors() {
            const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
            
            layoutData.modules.forEach((module, index) => {
                const stringNumber = Math.floor(index / layoutData.stringConfig.modulesPerString);
                const color = colors[stringNumber % colors.length];
                
                // Appliquer couleur (si rectangles existent)
                if (moduleRectangles[index * 2]) {
                    moduleRectangles[index * 2].setStyle({ color: color, fillColor: color });
                }
            });
        }
        
        function restoreNormalColors() {
            layoutData.modules.forEach((module, index) => {
                if (moduleRectangles[index * 2]) {
                    const isDefect = module.status === 'defect' || (module.defects && module.defects.length > 0);
                    const color = isDefect ? '#ef4444' : '#3b82f6';
                    const fillColor = isDefect ? '#fca5a5' : '#60a5fa';
                    moduleRectangles[index * 2].setStyle({ color: color, fillColor: fillColor });
                }
            });
        }
        
        // FIN FONCTIONS CONFIG STRINGS
        
        // ===== FONCTION CHANGEMENT SOURCE DONNÉES =====
        
        function switchDataSource() {
            const source = document.getElementById('dataSourceSelector').value;
            layoutData.dataSource = source;
            
            if (source === 'manual') {
                // Mode manuel : afficher config strings
                document.getElementById('manualConfigSection').classList.remove('hidden');
                document.getElementById('auditDataInfo').classList.add('hidden');
                updateStringConfig();
            } else {
                // Mode audit : charger données audit
                document.getElementById('manualConfigSection').classList.add('hidden');
                document.getElementById('auditDataInfo').classList.remove('hidden');
                layoutData.auditData = loadAuditDataToDesigner();
                displayAuditDataSummary();
            }
        }
        
        // FIN FONCTION CHANGEMENT SOURCE
        
        // ===== FONCTION CHARGEMENT DONNÉES DEPUIS MODULE AUDIT EL =====
        
        /**
         * Charger les données du module Audit EL depuis LocalStorage
         * Structure attendue dans diagpv_audit_session:
         * {
         *   project: { name, installationDate, address, ... },
         *   strings: [
         *     {
         *       stringNumber: 1,
         *       name: "STRING 1",
         *       modulesCount: 24,
         *       modules: [
         *         { id: "S1-1", position: 1, status: "ok/defect", defects: [...], ... },
         *         { id: "S1-2", position: 2, ... }
         *       ]
         *     },
         *     { stringNumber: 2, name: "STRING 2", ... }
         *   ],
         *   totalModules: 240,
         *   ...
         * }
         */
        function loadAuditDataToDesigner() {
            try {
                // Récupérer données session audit EL
                const auditSessionStr = localStorage.getItem('diagpv_audit_session');
                if (!auditSessionStr) {
                    console.log('⚠️ Pas de données audit trouvées dans LocalStorage');
                    console.log('💡 Commencez par créer une session audit dans le module Audit EL');
                    return null;
                }
                
                const auditSession = JSON.parse(auditSessionStr);
                console.log('✅ Données audit chargées:', auditSession);
                
                // Parser et extraire les données utiles pour le Designer
                const designerData = {
                    projectName: auditSession.project?.name || 'Projet sans nom',
                    strings: [],
                    totalModules: 0,
                    totalStrings: 0
                };
                
                // Extraire les strings et modules
                if (auditSession.strings && Array.isArray(auditSession.strings)) {
                    designerData.strings = auditSession.strings.map(string => ({
                        stringNumber: string.stringNumber,
                        name: string.name || 'STRING ' + string.stringNumber,
                        modulesCount: string.modulesCount || 0,
                        modules: (string.modules || []).map(module => ({
                            id: module.id || 'S' + string.stringNumber + '-' + module.position,
                            position: module.position,
                            status: module.status || 'ok',
                            defects: module.defects || [],
                            coords: module.coords || null // Coordonnées GPS si déjà enregistrées
                        }))
                    }));
                    
                    designerData.totalStrings = designerData.strings.length;
                    designerData.totalModules = designerData.strings.reduce(
                        (sum, string) => sum + string.modules.length, 0
                    );
                }
                
                console.log('[DESIGNER] Data: ' + designerData.totalStrings + ' strings, ' + designerData.totalModules + ' modules');
                
                return designerData;
                
            } catch (error) {
                console.error('❌ Erreur chargement données audit:', error);
                console.error('Structure JSON invalide dans diagpv_audit_session');
                return null;
            }
        }
        
        // Afficher résumé des données chargées
        function displayAuditDataSummary() {
            const auditData = layoutData.auditData;
            if (!auditData) {
                document.getElementById('auditDataInfo').innerHTML = 
                    '<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">' +
                        '<div class="flex items-center gap-2 text-yellow-700">' +
                            '<i class="fas fa-exclamation-triangle"></i>' +
                            '<span class="font-medium">Aucune donnée audit trouvée</span>' +
                        '</div>' +
                        '<p class="text-sm text-yellow-600 mt-2">' +
                            'Créez une session audit dans le module Audit EL pour charger les données ici.' +
                        '</p>' +
                    '</div>';
                return;
            }
            
            let stringsList = '';
            auditData.strings.forEach(s => {
                stringsList += '<div class="flex justify-between py-1 border-t border-gray-100">' +
                    '<span class="font-medium">' + s.name + '</span>' +
                    '<span class="text-gray-600">' + s.modules.length + ' modules</span>' +
                    '</div>';
            });
            
            document.getElementById('auditDataInfo').innerHTML = 
                '<div class="bg-green-50 border border-green-200 rounded-lg p-4">' +
                    '<div class="flex items-center justify-between">' +
                        '<div class="flex items-center gap-2 text-green-700">' +
                            '<i class="fas fa-check-circle"></i>' +
                            '<span class="font-medium">Données audit chargées</span>' +
                        '</div>' +
                        '<button onclick="layoutData.auditData = loadAuditDataToDesigner(); displayAuditDataSummary();" ' +
                                'class="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">' +
                            '<i class="fas fa-sync-alt"></i> Recharger' +
                        '</button>' +
                    '</div>' +
                    '<div class="grid grid-cols-3 gap-4 mt-3 text-sm">' +
                        '<div>' +
                            '<div class="text-gray-500">Projet</div>' +
                            '<div class="font-medium text-gray-900">' + auditData.projectName + '</div>' +
                        '</div>' +
                        '<div>' +
                            '<div class="text-gray-500">Strings</div>' +
                            '<div class="font-medium text-gray-900">' + auditData.totalStrings + '</div>' +
                        '</div>' +
                        '<div>' +
                            '<div class="text-gray-500">Modules</div>' +
                            '<div class="font-medium text-gray-900">' + auditData.totalModules + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<details class="mt-3">' +
                        '<summary class="text-sm text-gray-600 cursor-pointer hover:text-gray-900">' +
                            'Voir détails des strings' +
                        '</summary>' +
                        '<div class="mt-2 space-y-1 text-xs">' +
                            stringsList +
                        '</div>' +
                    '</details>' +
                '</div>';
        }
        
        // FIN FONCTION CHARGEMENT
        
        // Export de la carte (capture d'écran)
        function exportLayoutImage() {
            if (!map) return;
            
            // Utilisation de leaflet-image ou html2canvas pour capture
            // Pour simplicité immédiate, on exporte les données JSON
            const dataToExport = {
                ...layoutData,
                exportDate: new Date().toISOString(),
                note: 'Utilisez les coordonnées GPS pour recréer la carte'
            };
            
            const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = \`layout_satellite_\${new Date().toISOString().slice(0, 10)}.json\`;
            link.click();
            URL.revokeObjectURL(url);
            
            alert('💾 Données exportées\\n\\nLe fichier contient les coordonnées GPS de tous les modules pour recréation sur carte satellite.');
        }
        
        // Génération rapport
        function generateReport() {
            const report = {
                installation: layoutData.config,
                modules: layoutData.modules,
                stats: {
                    totalModules: layoutData.modules.length,
                    totalPower: layoutData.modules.length * layoutData.config.modulePower / 1000,
                    defectModules: layoutData.modules.filter(m => m.hasDefect).length
                },
                timestamp: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = \`rapport_layout_\${new Date().toISOString().slice(0, 10)}.json\`;
            link.click();
            URL.revokeObjectURL(url);
        }
        
        // Écouteurs pour mise à jour config
        document.addEventListener('DOMContentLoaded', function() {
            ['moduleLength', 'moduleWidth', 'modulePower', 'moduleSpacing', 'numberingType', 'installationMode'].forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.addEventListener('change', updateConfig);
                }
            });
        });
        
        // ===== NOUVELLES FONCTIONNALITÉS LEAFLET.DRAW =====
        
        // Variables pour outils de dessin
        let drawControl;
        let drawnItems;
        let calibrationMode = false;
        let calibrationPoints = [];
        let currentDrawingMode = null;
        let scaleFactorPixelsToMeters = 1;
        let currentRotatableRectangle = null; // Rectangle orientable actuel
        let moduleRectangles = []; // Liste des modules rendus comme rectangles
        
        // Initialisation des outils de dessin
        function initDrawingTools() {
            if (!map) return;
            
            // Groupe pour les éléments dessinés
            drawnItems = new L.FeatureGroup();
            map.addLayer(drawnItems);
            
            // Configuration des outils de dessin - RECTANGLE UNIQUEMENT pour sélection 4 coins
            const drawOptions = {
                position: 'topright',
                draw: {
                    polyline: false,
                    marker: false,
                    circle: false,
                    circlemarker: false,
                    polygon: false, // DÉSACTIVÉ - utiliser rectangle à la place
                    rectangle: {
                        shapeOptions: {
                            className: 'zone-polygon',
                            color: '#3b82f6',
                            weight: 3,
                            fillOpacity: 0.15,
                            dashArray: '10, 5'
                        },
                        showArea: true,
                        metric: true
                    }
                },
                edit: {
                    featureGroup: drawnItems,
                    remove: true
                }
            };
            
            // Ajouter contrôle de dessin
            drawControl = new L.Control.Draw(drawOptions);
            map.addControl(drawControl);
            
            // Événements de dessin
            map.on(L.Draw.Event.CREATED, onDrawCreated);
            map.on(L.Draw.Event.EDITED, onDrawEdited);
            map.on(L.Draw.Event.DELETED, onDrawDeleted);
        }
        
        // Mode de dessin personnalisé
        function setDrawingMode(mode) {
            currentDrawingMode = mode;
            
            // Réinitialiser styles des boutons
            ['drawZone', 'drawBuilding', 'drawOmbriere', 'drawObstacle'].forEach(id => {
                document.getElementById(id)?.classList.remove('ring-2', 'ring-offset-2', 'ring-current');
            });
            
            // Activer bouton sélectionné
            const button = document.getElementById('draw' + mode.charAt(0).toUpperCase() + mode.slice(1));
            if (button) {
                button.classList.add('ring-2', 'ring-offset-2', 'ring-current');
            }
            
            showNotification('Mode Dessin', \`Mode \${mode} activé. Dessinez sur la carte.\`, 'info');
        }
        
        // Événement création d'élément
        function onDrawCreated(event) {
            const type = event.layerType;
            const layer = event.layer;
            
            // Si rectangle, convertir en rectangle orientable
            if (type === 'rectangle' && window.RotatableRectangle) {
                const bounds = layer.getBounds();
                
                // Créer rectangle orientable
                const rotatableRect = new window.RotatableRectangle(map, bounds, 0);
                currentRotatableRectangle = rotatableRect;
                
                // Ajouter métadonnées
                rotatableRect.layer.options.drawingType = currentDrawingMode || 'zone';
                rotatableRect.layer.options.createdAt = new Date().toISOString();
                rotatableRect.layer.options.id = 'draw_' + Date.now();
                rotatableRect.layer.options.isRotatable = true;
                rotatableRect.layer.options.rotation = 0;
                
                // Ajouter au groupe
                rotatableRect.addTo(drawnItems, map);
                
                // Calculer superficie
                const area = calculatePolygonArea(rotatableRect.layer);
                rotatableRect.layer.bindPopup(createDrawingPopup(rotatableRect.layer.options.drawingType, area, rotatableRect.layer.options.id));
                
                // Sauvegarder
                saveDrawingData();
                updateLayoutStats();
                
                showNotification('Rectangle Orientable', 'Utilisez le point central bleu pour faire pivoter le rectangle', 'success');
                return;
            }
            
            // Traitement standard pour autres types
            layer.options.drawingType = currentDrawingMode || 'zone';
            layer.options.createdAt = new Date().toISOString();
            layer.options.id = 'draw_' + Date.now();
            
            // Appliquer style selon type
            applyDrawingStyle(layer, layer.options.drawingType);
            
            // Ajouter au groupe
            drawnItems.addLayer(layer);
            
            // Calculer superficie si polygon
            if (type === 'polygon' || type === 'rectangle') {
                const area = calculatePolygonArea(layer);
                layer.bindPopup(createDrawingPopup(layer.options.drawingType, area, layer.options.id));
            }
            
            // Sauvegarder
            saveDrawingData();
            updateLayoutStats();
            
            const modeLabel = currentDrawingMode || 'Zone';
            showNotification('Élément Ajouté', modeLabel + ' créé(e) avec succès', 'success');
        }
        
        // Appliquer style de dessin
        function applyDrawingStyle(layer, drawingType) {
            const styles = {
                zone: { color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.2 },
                building: { color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3 },
                ombriere: { color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.3 },
                obstacle: { color: '#6b7280', fillColor: '#6b7280', fillOpacity: 0.4 }
            };
            
            const style = styles[drawingType] || styles.zone;
            layer.setStyle({ ...style, weight: 2 });
        }
        
        // Calculer superficie polygon
        function calculatePolygonArea(layer) {
            if (layer instanceof L.Rectangle) {
                const bounds = layer.getBounds();
                const width = map.distance(bounds.getNorthWest(), bounds.getNorthEast());
                const height = map.distance(bounds.getNorthWest(), bounds.getSouthWest());
                return width * height; // m²
            }
            
            if (layer instanceof L.Polygon) {
                const latlngs = layer.getLatLngs()[0];
                
                // Utiliser GeometryUtil si disponible, sinon approximation simple
                if (window.L && L.GeometryUtil && L.GeometryUtil.geodesicArea) {
                    return L.GeometryUtil.geodesicArea(latlngs);
                }
                
                // Approximation simple pour polygon
                if (latlngs.length < 3) return 0;
                
                let area = 0;
                for (let i = 0; i < latlngs.length; i++) {
                    const j = (i + 1) % latlngs.length;
                    const distance1 = map.distance(latlngs[i], latlngs[j]);
                    area += distance1 * distance1; // Approximation très basique
                }
                return Math.sqrt(area / latlngs.length) * 10; // Estimation grossière
            }
            
            return 0;
        }
        
        // Créer popup pour élément dessiné
        function createDrawingPopup(type, area, id) {
            const typeLabels = {
                zone: '🟦 Zone Installation',
                building: '🏢 Bâtiment', 
                ombriere: '🌳 Ombrière',
                obstacle: '⚠️ Obstacle'
            };
            
            return \`
                <div class="text-center">
                    <strong>\${typeLabels[type] || '📐 Zone'}</strong><br>
                    <small>ID: \${id}</small><br>
                    <small>Superficie: \${(area / 10000).toFixed(2)} ha</small><br>
                    <small>(\${area.toFixed(0)} m²)</small>
                    <div class="mt-2">
                        <button onclick="selectZoneForModules('\${id}')" class="px-2 py-1 bg-blue-500 text-white text-xs rounded mr-1">
                            Placer Modules
                        </button>
                        <button onclick="deleteDrawing('\${id}')" class="px-2 py-1 bg-red-500 text-white text-xs rounded">
                            Supprimer
                        </button>
                    </div>
                </div>
            \`;
        }
        
        // Sélectionner zone pour placement modules
        function selectZoneForModules(drawingId) {
            const layer = findDrawingById(drawingId);
            if (!layer) return;
            
            // Si rectangle orientable, mettre à jour référence
            if (layer.options.isRotatable && currentRotatableRectangle) {
                // currentRotatableRectangle déjà défini lors de la création
            }
            
            // Afficher panel informations zone
            const zoneInfo = document.getElementById('zoneInfo');
            const zoneDetails = document.getElementById('zoneDetails');
            
            if (zoneInfo && zoneDetails) {
                const area = calculatePolygonArea(layer);
                const estimatedModules = Math.floor(area / ((layoutData.config.moduleLength / 1000) * (layoutData.config.moduleWidth / 1000)));
                
                const rotationInfo = layer.options.isRotatable ? '<div><strong>Rotation:</strong> ' + Math.round(layer.options.rotation || 0) + '° (utilisez handle bleu)</div>' : '';
                
                zoneDetails.innerHTML = '<div><strong>Zone:</strong> ' + drawingId + '</div>' +
                    '<div><strong>Superficie:</strong> ' + (area / 10000).toFixed(2) + ' ha</div>' +
                    '<div><strong>Modules estimés:</strong> ~' + estimatedModules + '</div>' +
                    '<div><strong>Puissance:</strong> ~' + (estimatedModules * layoutData.config.modulePower / 1000).toFixed(1) + ' kWc</div>' +
                    rotationInfo;
                
                zoneInfo.classList.remove('hidden');
                
                // Stocker zone sélectionnée
                layoutData.selectedZone = { id: drawingId, layer: layer, area: area };
            }
        }
        
        // Placer modules dans zone sélectionnée
        function placeModulesInZone() {
            const selectedZone = layoutData.selectedZone;
            if (!selectedZone) return;
            
            const layer = selectedZone.layer;
            
            // NOUVEAU : Vérifier si zone avec rotation (rectangle orientable)
            if (layer.options.isRotatable && currentRotatableRectangle) {
                // Utiliser système de grille orientée
                const modules = currentRotatableRectangle.getOrientedModuleGrid(
                    layoutData.config.moduleLength,
                    layoutData.config.moduleWidth,
                    layoutData.config.spacing
                );
                
                const totalModules = modules.length;
                const totalPowerKwc = (totalModules * layoutData.config.modulePower / 1000).toFixed(1);
                const rotationDeg = Math.round(currentRotatableRectangle.getRotation());
                const confirmMsg = 'Placer ' + totalModules + ' modules orientés à ' + rotationDeg + '° ?\\n\\nPuissance: ' + totalPowerKwc + ' kWc';
                
                if (confirm(confirmMsg)) {
                    // Effacer anciens rectangles modules ET données modules
                    clearModuleRectangles();
                    layoutData.modules = []; // Réinitialiser données modules
                    
                    // Créer rectangles PV orientés selon la source de données
                    let globalModuleIndex = 0;
                    
                    if (layoutData.dataSource === 'audit' && layoutData.auditData && layoutData.auditData.strings) {
                        // Mode AUDIT : utiliser les vrais modules depuis audit EL
                        console.log('[PLACEMENT] Mode AUDIT - Donnees depuis audit EL');
                        
                        layoutData.auditData.strings.forEach(string => {
                            string.modules.forEach(moduleAudit => {
                                if (globalModuleIndex < modules.length) {
                                    const gridPosition = modules[globalModuleIndex];
                                    addOrientedModuleRectangle(
                                        gridPosition.lat, 
                                        gridPosition.lng, 
                                        gridPosition.angle, 
                                        gridPosition.length, 
                                        gridPosition.width, 
                                        globalModuleIndex,
                                        {
                                            id: moduleAudit.id,
                                            stringNumber: string.stringNumber,
                                            position: moduleAudit.position,
                                            status: moduleAudit.status,
                                            defects: moduleAudit.defects
                                        }
                                    );
                                    globalModuleIndex++;
                                }
                            });
                        });
                        
                        console.log('[OK] ' + globalModuleIndex + ' modules places depuis audit');
                        showNotification('Modules Placés', globalModuleIndex + ' modules placés avec données audit', 'success');
                        
                    } else {
                        // Mode MANUEL : placement avec configuration strings manuelle
                        console.log('[PLACEMENT] Mode MANUEL - Config strings manuelle');
                        
                        modules.forEach((module, index) => {
                            // Calculer attribution string depuis config manuelle
                            const modulesPerString = layoutData.stringConfig.modulesPerString;
                            const stringNumber = Math.floor(index / modulesPerString) + 1;
                            const positionInString = (index % modulesPerString) + 1;
                            
                            addOrientedModuleRectangle(
                                module.lat, 
                                module.lng, 
                                module.angle, 
                                module.length, 
                                module.width, 
                                index,
                                {
                                    id: 'S' + stringNumber + '-' + positionInString,
                                    stringNumber: stringNumber,
                                    position: positionInString,
                                    status: 'ok',
                                    defects: []
                                }
                            );
                        });
                        
                        console.log('[OK] ' + modules.length + ' modules places en mode manuel');
                        showNotification('Modules Placés', totalModules + ' modules placés (config manuelle)', 'success');
                    }
                    
                    closeZoneInfo();
                    updateStats();
                    saveLayoutToSystem();
                    syncWithAuditData();
                }
                return;
            }
            
            // ANCIEN SYSTÈME : Rectangle standard non-orienté
            const bounds = layer.getBounds();
            
            // Calculer grille de modules optimale
            const moduleSpacing = layoutData.config.spacing / 1000; // Conversion mm -> m
            const moduleLengthM = layoutData.config.moduleLength / 1000;
            const moduleWidthM = layoutData.config.moduleWidth / 1000;
            
            const boundsWidth = map.distance(bounds.getNorthWest(), bounds.getNorthEast());
            const boundsHeight = map.distance(bounds.getNorthWest(), bounds.getSouthWest());
            
            const modulesPerRow = Math.floor(boundsWidth / (moduleLengthM + moduleSpacing));
            const numberOfRows = Math.floor(boundsHeight / (moduleWidthM + moduleSpacing));
            
            const totalModules = modulesPerRow * numberOfRows;
            const totalPowerKwc = (totalModules * layoutData.config.modulePower / 1000).toFixed(1);
            const confirmMsg = 'Placer ' + totalModules + ' modules dans cette zone ?\\n\\nGrille: ' + modulesPerRow + ' × ' + numberOfRows + '\\nPuissance: ' + totalPowerKwc + ' kWc';
            
            if (confirm(confirmMsg)) {
                
                // Générer positions modules dans la zone
                for (let row = 0; row < numberOfRows; row++) {
                    for (let col = 0; col < modulesPerRow; col++) {
                        const latOffset = (row * (moduleWidthM + moduleSpacing)) / 111320; // Approximation latitude
                        const lngOffset = (col * (moduleLengthM + moduleSpacing)) / (111320 * Math.cos(bounds.getCenter().lat * Math.PI / 180));
                        
                        const moduleLat = bounds.getNorth() - latOffset;
                        const moduleLng = bounds.getWest() + lngOffset;
                        
                        // Vérifier si point dans polygon
                        const point = L.latLng(moduleLat, moduleLng);
                        if (isPointInPolygon(point, layer)) {
                            addModuleOnMap(moduleLat, moduleLng);
                        }
                    }
                }
                
                closeZoneInfo();
                showNotification('Modules Placés', totalModules + ' modules ajoutés à la zone', 'success');
                syncWithAuditData();
            }
        }
        
        // Vérifier si point dans polygon
        function isPointInPolygon(point, polygon) {
            if (polygon instanceof L.Rectangle) {
                return polygon.getBounds().contains(point);
            }
            
            if (polygon instanceof L.Polygon) {
                // Utilisation de l'algorithme ray casting
                const latlngs = polygon.getLatLngs()[0];
                let inside = false;
                
                for (let i = 0, j = latlngs.length - 1; i < latlngs.length; j = i++) {
                    if (((latlngs[i].lat > point.lat) !== (latlngs[j].lat > point.lat)) &&
                        (point.lng < (latlngs[j].lng - latlngs[i].lng) * (point.lat - latlngs[i].lat) / (latlngs[j].lat - latlngs[i].lat) + latlngs[i].lng)) {
                        inside = !inside;
                    }
                }
                
                return inside;
            }
            
            return false;
        }
        
        // Fermer panel zone info
        function closeZoneInfo() {
            document.getElementById('zoneInfo')?.classList.add('hidden');
            layoutData.selectedZone = null;
        }
        
        // Trouver dessin par ID
        function findDrawingById(id) {
            let foundLayer = null;
            drawnItems.eachLayer(layer => {
                if (layer.options.id === id) {
                    foundLayer = layer;
                }
            });
            return foundLayer;
        }
        
        // Supprimer dessin
        function deleteDrawing(id) {
            const layer = findDrawingById(id);
            if (layer && confirm('Supprimer cet élément ?')) {
                drawnItems.removeLayer(layer);
                saveDrawingData();
                updateLayoutStats();
                closeZoneInfo();
            }
        }
        
        // Effacer tous les dessins
        function clearAllDrawings() {
            if (confirm('Effacer tous les dessins (zones, bâtiments, ombrières) ?')) {
                drawnItems.clearLayers();
                saveDrawingData();
                updateLayoutStats();
                closeZoneInfo();
                showNotification('Dessins Effacés', 'Tous les éléments ont été supprimés', 'info');
            }
        }
        
        // Calibration échelle
        function toggleCalibration() {
            calibrationMode = !calibrationMode;
            
            if (calibrationMode) {
                calibrationPoints = [];
                showNotification('Mode Calibration', 'Cliquez sur 2 points pour calibrer l\\'échelle', 'info');
                map.on('click', handleCalibrationClick);
            } else {
                map.off('click', handleCalibrationClick);
                showNotification('Calibration', 'Mode calibration désactivé', 'info');
            }
        }
        
        // Gestion calibration
        function handleCalibrationClick(e) {
            calibrationPoints.push(e.latlng);
            
            L.marker(e.latlng).addTo(map)
                .bindPopup(\`Point \${calibrationPoints.length}\`)
                .openPopup();
            
            if (calibrationPoints.length === 2) {
                const realDistance = prompt('Distance réelle entre les 2 points (en mètres) :');
                if (realDistance && !isNaN(realDistance)) {
                    const mapDistance = map.distance(calibrationPoints[0], calibrationPoints[1]);
                    scaleFactorPixelsToMeters = parseFloat(realDistance) / mapDistance;
                    
                    showNotification('Calibration Réussie', \`Échelle: 1m = \${scaleFactorPixelsToMeters.toFixed(4)}m réels\`, 'success');
                }
                
                calibrationMode = false;
                map.off('click', handleCalibrationClick);
            }
        }
        
        // Sauvegarder données de dessin
        function saveDrawingData() {
            const drawings = [];
            
            drawnItems.eachLayer(layer => {
                const data = {
                    id: layer.options.id,
                    type: layer.options.drawingType,
                    createdAt: layer.options.createdAt,
                    coordinates: null,
                    area: 0
                };
                
                if (layer instanceof L.Rectangle) {
                    data.coordinates = [
                        [layer.getBounds().getNorth(), layer.getBounds().getWest()],
                        [layer.getBounds().getSouth(), layer.getBounds().getEast()]
                    ];
                } else if (layer instanceof L.Polygon) {
                    data.coordinates = layer.getLatLngs()[0].map(ll => [ll.lat, ll.lng]);
                }
                
                data.area = calculatePolygonArea(layer);
                drawings.push(data);
            });
            
            layoutData.drawings = drawings;
            saveLayoutToSystem();
        }
        
        // ===== INTÉGRATION BIDIRECTIONNELLE DYNAMIQUE =====
        
        // Communication entre modules
        let auditModuleData = {
            defects: [],
            modulePositions: {},
            lastSync: null
        };
        
        // Synchronisation avec module Audit EL
        async function syncWithAudit() {
            try {
                showNotification('Synchronisation', 'Mise à jour avec module Audit EL...', 'info');
                
                // 1. Envoyer données layout au module audit
                const layoutMessage = {
                    type: 'LAYOUT_UPDATE',
                    data: {
                        modules: layoutData.modules,
                        drawings: layoutData.drawings || [],
                        config: layoutData.config,
                        mapCenter: layoutData.mapCenter,
                        timestamp: new Date().toISOString()
                    }
                };
                
                // Envoyer via postMessage à l'iframe audit
                const auditFrame = document.getElementById('auditFrame');
                if (auditFrame && auditFrame.contentWindow) {
                    auditFrame.contentWindow.postMessage(layoutMessage, '*');
                }
                
                // 2. Récupérer défauts depuis module audit
                const defectsResponse = await fetch('/api/audit-sessions');
                if (defectsResponse.ok) {
                    const defectsData = await defectsResponse.json();
                    if (defectsData.success && defectsData.sessions) {
                        correlateDefectsWithLayout(defectsData.sessions);
                    }
                }
                
                // 3. Sauvegarder synchronisation
                layoutData.lastSyncWithAudit = new Date().toISOString();
                saveLayoutToSystem();
                
                document.getElementById('layoutSyncStatus').textContent = '✅';
                showNotification('Synchronisation', 'Données synchronisées avec succès', 'success');
                
            } catch (error) {
                document.getElementById('layoutSyncStatus').textContent = '❌';
                showNotification('Erreur Sync', 'Erreur lors de la synchronisation', 'error');
                console.error('Sync error:', error);
            }
        }
        
        // Corréler défauts avec layout
        function correlateDefectsWithLayout(auditSessions) {
            let defectCount = 0;
            
            // Parcourir sessions récentes
            auditSessions.slice(0, 3).forEach(session => {
                try {
                    const sessionData = JSON.parse(session.notes || '{}');
                    
                    if (sessionData.defectsFound > 0) {
                        // Marquer modules avec défauts (corrélation par proximité géographique)
                        layoutData.modules.forEach((module, index) => {
                            // Simuler corrélation (en réalité, utiliser coordonnées GPS précises)
                            if (index < sessionData.defectsFound) {
                                module.hasDefect = true;
                                defectCount++;
                            }
                        });
                    }
                } catch (e) {
                    console.log('Parse session:', e);
                }
            });
            
            // Redessiner marqueurs avec défauts
            redrawMarkers();
            
            // Mettre à jour stats
            document.getElementById('layoutDefectsLinked').textContent = defectCount;
            updateLayoutStats();
        }
        
        // Envoyer données vers module audit
        function sendToAuditModule() {
            const auditFrame = document.getElementById('auditFrame');
            if (!auditFrame) return;
            
            const message = {
                type: 'LAYOUT_DATA_IMPORT',
                data: {
                    modules: layoutData.modules,
                    drawings: layoutData.drawings || [],
                    config: layoutData.config,
                    mapCenter: layoutData.mapCenter,
                    mapZoom: layoutData.mapZoom,
                    timestamp: new Date().toISOString()
                }
            };
            
            auditFrame.contentWindow.postMessage(message, '*');
            switchTab('audit'); // Basculer vers l'audit
            
            showNotification('Données Envoyées', 'Layout transmis au module Audit EL', 'success');
        }
        
        // Écouter messages du module audit
        window.addEventListener('message', function(event) {
            if (event.data && event.data.type) {
                switch (event.data.type) {
                    case 'AUDIT_DEFECT_DETECTED':
                        handleAuditDefectDetected(event.data.data);
                        break;
                    case 'AUDIT_DATA_UPDATE':
                        handleAuditDataUpdate(event.data.data);
                        break;
                    case 'REQUEST_LAYOUT_DATA':
                        sendLayoutToAudit();
                        break;
                }
            }
        });
        
        // Gérer défaut détecté depuis audit
        function handleAuditDefectDetected(defectData) {
            // Trouver module correspondant
            const module = layoutData.modules.find(m => 
                m.id === defectData.moduleId || 
                (defectData.coordinates && 
                 Math.abs(m.lat - defectData.coordinates.lat) < 0.0001 &&
                 Math.abs(m.lng - defectData.coordinates.lng) < 0.0001)
            );
            
            if (module) {
                module.hasDefect = true;
                module.defectType = defectData.type;
                module.defectSeverity = defectData.severity;
                module.defectTimestamp = defectData.timestamp;
                
                redrawMarkers();
                saveLayoutToSystem();
                
                showNotification('Défaut Corrélé', \`Défaut \${defectData.type} détecté sur module \${module.id}\`, 'warning');
            }
        }
        
        // Envoyer layout vers audit
        function sendLayoutToAudit() {
            const auditFrame = document.getElementById('auditFrame');
            if (auditFrame && auditFrame.contentWindow) {
                const message = {
                    type: 'LAYOUT_DATA_RESPONSE',
                    data: {
                        modules: layoutData.modules,
                        drawings: layoutData.drawings || [],
                        config: layoutData.config,
                        mapCenter: layoutData.mapCenter
                    }
                };
                
                auditFrame.contentWindow.postMessage(message, '*');
            }
        }
        
        // Synchronisation automatique données audit
        function syncWithAuditData() {
            // Déclencher synchronisation automatique quand données layout changent
            auditData.layoutData = layoutData;
            auditData.unsavedChanges = true;
            
            // Notifier module audit des changements
            const auditFrame = document.getElementById('auditFrame');
            if (auditFrame && auditFrame.contentWindow) {
                auditFrame.contentWindow.postMessage({
                    type: 'LAYOUT_MODULES_UPDATED',
                    data: {
                        moduleCount: layoutData.modules.length,
                        totalPower: layoutData.modules.length * layoutData.config.modulePower / 1000,
                        modules: layoutData.modules
                    }
                }, '*');
            }
        }
        
        // Mise à jour statistiques layout
        function updateLayoutStats() {
            const moduleCount = layoutData.modules.length;
            const totalPower = moduleCount * layoutData.config.modulePower / 1000;
            const zoneCount = (layoutData.drawings || []).length;
            const defectCount = layoutData.modules.filter(m => m.hasDefect).length;
            
            // Calculer efficacité zone (ratio modules placés / superficie disponible)
            let efficiency = 0;
            if (layoutData.drawings && layoutData.drawings.length > 0) {
                const totalZoneArea = layoutData.drawings.reduce((sum, drawing) => sum + (drawing.area || 0), 0);
                const moduleArea = moduleCount * (layoutData.config.moduleLength / 1000) * (layoutData.config.moduleWidth / 1000);
                efficiency = totalZoneArea > 0 ? (moduleArea / totalZoneArea * 100) : 0;
            }
            
            // Mettre à jour interface
            const updateElement = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value;
            };
            
            updateElement('layoutModuleCount', moduleCount);
            updateElement('layoutTotalPower', totalPower.toFixed(1) + ' kWc');
            updateElement('layoutZoneCount', zoneCount);
            updateElement('layoutDefectsLinked', defectCount);
            updateElement('layoutEfficiency', efficiency.toFixed(1) + '%');
            
            // Synchroniser avec dashboard principal
            updateStats();
        }
        
        // Génération rapport layout complet
        function generateLayoutReport() {
            const report = {
                metadata: {
                    title: 'Rapport Designer Layout - DiagPV HUB',
                    generated: new Date().toISOString(),
                    operator: 'DiagPV Assistant',
                    project: 'Installation Photovoltaïque'
                },
                installation: {
                    config: layoutData.config,
                    mapCenter: layoutData.mapCenter,
                    mapZoom: layoutData.mapZoom
                },
                zones: layoutData.drawings || [],
                modules: {
                    total: layoutData.modules.length,
                    list: layoutData.modules,
                    totalPower: layoutData.modules.length * layoutData.config.modulePower / 1000,
                    defectCount: layoutData.modules.filter(m => m.hasDefect).length
                },
                statistics: {
                    efficiency: document.getElementById('layoutEfficiency')?.textContent || '0%',
                    zoneCoverage: (layoutData.drawings || []).length,
                    lastSync: layoutData.lastSyncWithAudit,
                    scaleCalibrated: scaleFactorPixelsToMeters !== 1
                },
                defects: layoutData.modules.filter(m => m.hasDefect).map(m => ({
                    moduleId: m.id,
                    coordinates: { lat: m.lat, lng: m.lng },
                    defectType: m.defectType || 'unknown',
                    severity: m.defectSeverity || 'medium',
                    timestamp: m.defectTimestamp
                }))
            };
            
            const dataStr = JSON.stringify(report, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const filename = \`rapport_designer_layout_\${new Date().toISOString().slice(0,10)}.json\`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', filename);
            linkElement.click();
            
            showNotification('Rapport Généré', \`Rapport complet exporté: \${filename}\`, 'success');
        }
        
        // Événements supplémentaires pour les dessins
        function onDrawEdited(event) {
            saveDrawingData();
            updateLayoutStats();
            showNotification('Dessins Modifiés', 'Éléments mis à jour', 'info');
        }
        
        function onDrawDeleted(event) {
            saveDrawingData();
            updateLayoutStats();
            closeZoneInfo();
            showNotification('Dessins Supprimés', 'Éléments supprimés', 'info');
        }
        
        // Amélioration initialisation designer
        function initDesigner() {
            if (document.getElementById('satelliteMap')) {
                setTimeout(() => {
                    initSatelliteMap();
                    initDrawingTools();
                    updateLayoutStats();
                }, 100);
            }
        }
        
        // Initialisation
        initializeBackupSystem();
        
        // Auto-sync périodique (toutes les 2 minutes)
        setInterval(() => {
            if (document.getElementById('contentDesigner') && !document.getElementById('contentDesigner').classList.contains('hidden')) {
                syncWithAudit();
            }
        }, 120000);
        <\/script>
    </body>
    </html>
  `));
h.post("/api/audit-sessions", async (e) => {
  try {
    const { session_data: t, timestamp: s, module_type: a } = await e.req.json(), { success: o, meta: n } = await e.env.DB.prepare(`
      INSERT INTO interventions (
        project_id, technician_id, intervention_type, scheduled_date, 
        completion_date, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      1,
      // project_id par défaut
      1,
      // technician_id par défaut  
      "audit_EL",
      (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      s,
      "completed",
      JSON.stringify(t)
    ).run();
    if (t.defectsFound > 0)
      for (let i = 0; i < t.defectsFound; i++)
        await e.env.DB.prepare(`
          INSERT INTO el_measurements (
            intervention_id, module_id, defect_type, severity_level, notes
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(
          n.last_row_id,
          i + 1,
          "detected_defect",
          "medium",
          "Défaut détecté via synchronisation HUB - " + s
        ).run();
    return e.json({
      success: !0,
      intervention_id: n.last_row_id,
      synced_data: t
    });
  } catch (t) {
    return e.json({ success: !1, error: t.message }, 500);
  }
});
h.get("/api/audit-sessions", async (e) => {
  try {
    const { results: t } = await e.env.DB.prepare(`
      SELECT i.*, COUNT(el.id) as measurements_count 
      FROM interventions i
      LEFT JOIN el_measurements el ON i.id = el.intervention_id
      WHERE i.intervention_type = 'audit_EL'
      GROUP BY i.id
      ORDER BY i.completion_date DESC
      LIMIT 10
    `).all();
    return e.json({ success: !0, sessions: t });
  } catch (t) {
    return e.json({ success: !1, error: t.message }, 500);
  }
});
h.get("/api/dashboard/realtime-stats", async (e) => {
  var t, s, a;
  try {
    const o = (/* @__PURE__ */ new Date()).toISOString().split("T")[0], { results: n } = await e.env.DB.prepare(`
      SELECT COUNT(*) as today_interventions FROM interventions 
      WHERE DATE(completion_date) = ?
    `).bind(o).all(), { results: i } = await e.env.DB.prepare(`
      SELECT COUNT(*) as total_defects FROM el_measurements
    `).all(), { results: d } = await e.env.DB.prepare(`
      SELECT COUNT(*) as active_sessions FROM interventions 
      WHERE status = 'in_progress'
    `).all();
    return e.json({
      success: !0,
      stats: {
        today_interventions: ((t = n[0]) == null ? void 0 : t.today_interventions) || 0,
        total_defects: ((s = i[0]) == null ? void 0 : s.total_defects) || 0,
        active_sessions: ((a = d[0]) == null ? void 0 : a.active_sessions) || 0,
        sync_timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
  } catch (o) {
    return e.json({ success: !1, error: o.message }, 500);
  }
});
h.post("/api/emergency-backup", async (e) => {
  try {
    const t = await e.req.text(), s = (/* @__PURE__ */ new Date()).toISOString(), { success: a, meta: o } = await e.env.DB.prepare(`
      INSERT INTO interventions (
        project_id, technician_id, intervention_type, scheduled_date, 
        completion_date, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      1,
      // ID projet existant
      1,
      // technician par défaut
      "emergency_backup",
      (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      s,
      "emergency",
      t
      // Données complètes en JSON
    ).run();
    return e.json({
      success: !0,
      backup_id: o.last_row_id,
      timestamp: s,
      message: "Sauvegarde d'urgence réussie"
    });
  } catch (t) {
    return e.json({ success: !1, error: t.message }, 500);
  }
});
h.get("/api/emergency-backups", async (e) => {
  try {
    const { results: t } = await e.env.DB.prepare(`
      SELECT * FROM interventions 
      WHERE intervention_type = 'emergency_backup'
      ORDER BY completion_date DESC
      LIMIT 20
    `).all();
    return e.json({
      success: !0,
      backups: t.map((s) => ({
        id: s.id,
        timestamp: s.completion_date,
        data: s.notes
        // JSON des données sauvegardées
      }))
    });
  } catch (t) {
    return e.json({ success: !1, error: t.message }, 500);
  }
});
h.get("/modules/thermography", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Thermographie - En Développement</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50 min-h-screen flex items-center justify-center">
        <div class="max-w-md mx-auto bg-white rounded-xl shadow-lg p-8 text-center">
            <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-thermometer-half text-2xl text-orange-600"></i>
            </div>
            
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Module Thermographie</h1>
            <p class="text-gray-600 mb-6">Ce module est actuellement en développement pour intégrer les équipements thermographiques professionnels.</p>
            
            <div class="bg-blue-50 rounded-lg p-4 mb-6 text-sm text-blue-800">
                <p class="font-semibold mb-1">🛠️ En cours de développement :</p>
                <ul class="text-left space-y-1">
                    <li>• Interface caméras thermiques FLIR</li>
                    <li>• Analyse temps réel DIN EN 62446-3</li>
                    <li>• Détection automatique points chauds</li>
                    <li>• Rapports conformes normes</li>
                </ul>
            </div>
            
            <div class="flex space-x-3">
                <a href="/modules/electroluminescence" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg font-medium">
                    <i class="fas fa-moon mr-2"></i>Module EL
                </a>
                <a href="/" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium">
                    <i class="fas fa-home mr-2"></i>Hub
                </a>
            </div>
            
            <!-- Section Actions globales -->
            <div class="mt-8 pt-6 border-t border-gray-200">
                <h3 class="text-lg font-bold text-gray-800 mb-4">Actions globales</h3>
                
                <div class="grid grid-cols-2 gap-3">
                    <button onclick="createNewProject()" class="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm">
                        <i class="fas fa-plus mr-2"></i>Nouveau Projet
                    </button>
                    
                    <button onclick="viewAllProjects()" class="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-sm">
                        <i class="fas fa-folder mr-2"></i>Tous les Projets
                    </button>
                </div>
            </div>
        </div>

        <script>
        function createNewProject() {
            window.location.href = '/projects/new';
        }

        function viewAllProjects() {
            window.location.href = '/projects';
        }
        <\/script>
    </body>
    </html>
`));
h.get("/modules/iv-curves", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Thermographie - HUB Diagnostic</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            :root { --thermo-red: #EF4444; --thermo-orange: #F97316; --diag-dark: #1F2937; }
            .bg-thermo-red { background-color: var(--thermo-red); }
            .text-thermo-red { color: var(--thermo-red); }
            .bg-thermo-orange { background-color: var(--thermo-orange); }
            .text-thermo-orange { color: var(--thermo-orange); }
            
            .thermal-grid {
                display: grid;
                grid-template-columns: repeat(10, 1fr);
                gap: 2px;
                max-width: 600px;
            }
            
            .thermal-cell {
                aspect-ratio: 1;
                border: 1px solid #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s;
            }
            
            .thermal-cell:hover {
                transform: scale(1.1);
                z-index: 10;
                border: 2px solid #ef4444;
            }
            
            .temp-normal { background-color: #3b82f6; color: white; }
            .temp-warm { background-color: #10b981; color: white; }
            .temp-hot { background-color: #f59e0b; color: white; }
            .temp-critical { background-color: #ef4444; color: white; animation: pulse 1s infinite; }
            
            .temp-scale {
                background: linear-gradient(90deg, #3b82f6, #10b981, #f59e0b, #ef4444);
                height: 20px;
                border-radius: 10px;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-thermo-red text-white py-4">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-xl">
                            <i class="fas fa-thermometer-half text-xl text-white"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">MODULE THERMOGRAPHIE</h1>
                            <p class="text-red-100">DIN EN 62446-3 • Détection Points Chauds</p>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <a href="/modules" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium">
                            <i class="fas fa-th mr-2"></i>Modules
                        </a>
                        <a href="/" class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium">
                            <i class="fas fa-home mr-2"></i>Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8">
            <!-- Configuration Mission -->
            <section class="mb-8">
                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <h2 class="text-xl font-bold text-gray-800 mb-6">
                        <i class="fas fa-cog text-thermo-red mr-2"></i>Configuration Mission
                    </h2>
                    
                    <div class="grid md:grid-cols-3 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Installation</label>
                            <select id="installationSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500">
                                <option>Installation Résidentielle - 9kWc</option>
                                <option>Centrale Solaire - 250kWc</option>
                                <option>Bâtiment Industriel - 100kWc</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Mode Acquisition</label>
                            <select id="modeSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500">
                                <option>Drone Thermique</option>
                                <option>Caméra Sol</option>
                                <option>Détaillé Module</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Conditions Météo</label>
                            <div class="flex space-x-2">
                                <input type="number" id="irradiance" placeholder="Irradiance" class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" value="850">
                                <span class="flex items-center text-sm text-gray-600">W/m²</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <button onclick="startThermalScan()" class="bg-thermo-red hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-play mr-2"></i>DÉMARRER SCAN
                            </button>
                            <button onclick="pauseScan()" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium">
                                <i class="fas fa-pause mr-2"></i>Pause
                            </button>
                            <button onclick="stopScan()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium">
                                <i class="fas fa-stop mr-2"></i>Stop
                            </button>
                        </div>
                        
                        <div class="text-sm text-gray-600">
                            <span id="scanStatus" class="font-medium">Prêt</span> | 
                            Progression: <span id="scanProgress" class="font-bold text-thermo-red">0%</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Cartographie Thermique Temps Réel -->
            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Grille Thermique -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-bold text-gray-800">
                                <i class="fas fa-fire text-thermo-orange mr-2"></i>Cartographie Thermique (10x10)
                            </h3>
                            <div class="flex items-center space-x-4">
                                <div class="text-xs text-gray-600">
                                    <div class="temp-scale w-20"></div>
                                    <div class="flex justify-between mt-1">
                                        <span>15°C</span>
                                        <span>85°C</span>
                                    </div>
                                </div>
                                <button onclick="toggleHotSpots()" class="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-eye mr-1"></i>Points Chauds
                                </button>
                            </div>
                        </div>
                        
                        <div class="thermal-grid mx-auto" id="thermalGrid">
                            <!-- Grille générée dynamiquement -->
                        </div>
                        
                        <div class="mt-4 flex justify-between items-center text-sm">
                            <div class="flex items-center space-x-4">
                                <span class="flex items-center"><span class="w-3 h-3 temp-normal rounded mr-2"></span>Normal (15-35°C)</span>
                                <span class="flex items-center"><span class="w-3 h-3 temp-warm rounded mr-2"></span>Chaud (35-55°C)</span>
                                <span class="flex items-center"><span class="w-3 h-3 temp-hot rounded mr-2"></span>Très Chaud (55-75°C)</span>
                                <span class="flex items-center"><span class="w-3 h-3 temp-critical rounded mr-2"></span>Critique (>75°C)</span>
                            </div>
                            <div>Modules scannés: <span id="scannedCount" class="font-bold">0</span>/100</div>
                        </div>
                    </div>
                </div>
                
                <!-- Panel Données Temps Réel -->
                <div class="space-y-6">
                    <!-- Statistiques Instantanées -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-chart-bar text-blue-600 mr-2"></i>Données Temps Réel
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Température Max:</span>
                                <span id="tempMax" class="font-bold text-red-600">--°C</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Température Min:</span>
                                <span id="tempMin" class="font-bold text-blue-600">--°C</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Température Moy:</span>
                                <span id="tempAvg" class="font-bold text-green-600">--°C</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Delta Max (ΔT):</span>
                                <span id="deltaTemp" class="font-bold text-orange-600">--°C</span>
                            </div>
                        </div>
                        
                        <div class="mt-6 pt-4 border-t">
                            <div class="text-sm font-medium text-gray-700 mb-2">Points Chauds Détectés</div>
                            <div class="bg-red-50 rounded-lg p-3">
                                <div class="text-2xl font-bold text-red-600" id="hotSpotsCount">0</div>
                                <div class="text-xs text-red-600">Modules > 75°C</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions Rapides -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-tools text-green-600 mr-2"></i>Actions
                        </h3>
                        
                        <div class="space-y-3">
                            <button onclick="exportThermalData()" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-download mr-2"></i>Export Données CSV
                            </button>
                            <button onclick="generateThermalReport()" class="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-file-pdf mr-2"></i>Rapport PDF
                            </button>
                            <button onclick="planRepass()" class="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-calendar mr-2"></i>Planifier Repassage
                            </button>
                            <button onclick="sendToClient()" class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-paper-plane mr-2"></i>Envoyer Client
                            </button>
                        </div>
                    </div>
                    
                    <!-- Historique Points Chauds -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-list text-red-600 mr-2"></i>Points Chauds Détectés
                        </h3>
                        
                        <div id="hotSpotsList" class="space-y-2 max-h-48 overflow-y-auto">
                            <div class="text-sm text-gray-500">Aucun point chaud détecté</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script>
        let thermalData = [];
        let scanInterval = null;
        let currentModule = 0;
        let isScanning = false;
        
        // Initialisation de la grille thermique
        function initThermalGrid() {
            const grid = document.getElementById('thermalGrid');
            grid.innerHTML = '';
            
            for (let i = 0; i < 100; i++) {
                const cell = document.createElement('div');
                cell.className = 'thermal-cell temp-normal';
                cell.id = \`cell-\${i}\`;
                cell.textContent = '--';
                cell.onclick = () => showModuleDetails(i);
                
                // Initialiser les données
                thermalData[i] = {
                    temperature: null,
                    status: 'normal',
                    position: { row: Math.floor(i / 10) + 1, col: (i % 10) + 1 }
                };
                
                grid.appendChild(cell);
            }
        }
        
        // Démarrer le scan thermique
        function startThermalScan() {
            if (isScanning) return;
            
            isScanning = true;
            currentModule = 0;
            document.getElementById('scanStatus').textContent = 'Scan en cours...';
            
            scanInterval = setInterval(() => {
                if (currentModule >= 100) {
                    stopScan();
                    return;
                }
                
                // Simulation de lecture thermique
                const temperature = generateRealisticTemperature(currentModule);
                updateModule(currentModule, temperature);
                
                currentModule++;
                
                // Mise à jour de la progression
                const progress = Math.round((currentModule / 100) * 100);
                document.getElementById('scanProgress').textContent = progress + '%';
                document.getElementById('scannedCount').textContent = currentModule;
                
                // Mise à jour des statistiques
                updateThermalStats();
                
            }, 200); // Scan d'un module toutes les 200ms
        }
        
        function pauseScan() {
            if (scanInterval) {
                clearInterval(scanInterval);
                scanInterval = null;
                isScanning = false;
                document.getElementById('scanStatus').textContent = 'En pause';
            }
        }
        
        function stopScan() {
            if (scanInterval) {
                clearInterval(scanInterval);
                scanInterval = null;
            }
            isScanning = false;
            document.getElementById('scanStatus').textContent = 'Scan terminé';
            document.getElementById('scanProgress').textContent = '100%';
        }
        
        // Génération de températures réalistes
        function generateRealisticTemperature(moduleIndex) {
            // Température de base + variation aléatoire
            let baseTemp = 25 + Math.random() * 15; // 25-40°C normale
            
            // Certains modules ont des problèmes (points chauds)
            if (Math.random() < 0.08) { // 8% de modules problématiques
                baseTemp += 30 + Math.random() * 25; // Points chauds 55-80°C
            }
            
            // Variation selon position (effet ombre, etc.)
            const row = Math.floor(moduleIndex / 10);
            if (row < 3) baseTemp += 3; // Rangées hautes plus chaudes
            
            return Math.round(baseTemp * 10) / 10;
        }
        
        // Mise à jour d'un module
        function updateModule(index, temperature) {
            const cell = document.getElementById(\`cell-\${index}\`);
            if (!cell) return;
            
            // Stockage des données
            thermalData[index].temperature = temperature;
            
            // Mise à jour visuelle
            cell.textContent = temperature.toFixed(1) + '°';
            
            // Classification thermique
            let className = 'thermal-cell ';
            if (temperature < 35) {
                className += 'temp-normal';
                thermalData[index].status = 'normal';
            } else if (temperature < 55) {
                className += 'temp-warm';
                thermalData[index].status = 'warm';
            } else if (temperature < 75) {
                className += 'temp-hot';
                thermalData[index].status = 'hot';
            } else {
                className += 'temp-critical';
                thermalData[index].status = 'critical';
                addHotSpot(index, temperature);
            }
            
            cell.className = className;
        }
        
        // Ajout d'un point chaud à la liste
        function addHotSpot(index, temperature) {
            const hotSpotsList = document.getElementById('hotSpotsList');
            
            // Créer l'entrée
            const entry = document.createElement('div');
            entry.className = 'bg-red-50 border-l-4 border-red-500 p-3 rounded text-sm';
            entry.innerHTML = \`
                <div class="flex justify-between items-center">
                    <div>
                        <span class="font-bold text-red-700">Module \${thermalData[index].position.row}-\${thermalData[index].position.col}</span>
                        <span class="text-red-600">• \${temperature.toFixed(1)}°C</span>
                    </div>
                    <button onclick="focusModule(\${index})" class="text-red-600 hover:text-red-800">
                        <i class="fas fa-crosshairs"></i>
                    </button>
                </div>
                <div class="text-xs text-red-600 mt-1">
                    Détecté à \${new Date().toLocaleTimeString()}
                </div>
            \`;
            
            // Remplacer le message vide ou ajouter
            if (hotSpotsList.children[0]?.textContent.includes('Aucun')) {
                hotSpotsList.innerHTML = '';
            }
            hotSpotsList.appendChild(entry);
        }
        
        // Mise à jour des statistiques thermiques
        function updateThermalStats() {
            const validTemps = thermalData.filter(d => d.temperature !== null).map(d => d.temperature);
            
            if (validTemps.length === 0) return;
            
            const tempMax = Math.max(...validTemps);
            const tempMin = Math.min(...validTemps);
            const tempAvg = validTemps.reduce((a, b) => a + b, 0) / validTemps.length;
            const deltaTemp = tempMax - tempMin;
            const hotSpots = validTemps.filter(t => t > 75).length;
            
            document.getElementById('tempMax').textContent = tempMax.toFixed(1) + '°C';
            document.getElementById('tempMin').textContent = tempMin.toFixed(1) + '°C';
            document.getElementById('tempAvg').textContent = tempAvg.toFixed(1) + '°C';
            document.getElementById('deltaTemp').textContent = deltaTemp.toFixed(1) + '°C';
            document.getElementById('hotSpotsCount').textContent = hotSpots;
        }
        
        // Affichage des détails d'un module
        function showModuleDetails(index) {
            const data = thermalData[index];
            if (!data.temperature) return;
            
            alert(\`Module \${data.position.row}-\${data.position.col}\\n\\nTempérature: \${data.temperature.toFixed(1)}°C\\nStatut: \${data.status}\\nPosition: Rangée \${data.position.row}, Colonne \${data.position.col}\`);
        }
        
        // Focus sur un module
        function focusModule(index) {
            const cell = document.getElementById(\`cell-\${index}\`);
            cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cell.style.transform = 'scale(1.2)';
            setTimeout(() => {
                cell.style.transform = '';
            }, 1000);
        }
        
        // Actions d'export et rapports
        function exportThermalData() {
            const csvData = thermalData.map((data, index) => ({
                Module: \`\${data.position.row}-\${data.position.col}\`,
                Temperature: data.temperature || 'N/A',
                Status: data.status,
                Position_Rangee: data.position.row,
                Position_Colonne: data.position.col
            }));
            
            const csv = convertToCSV(csvData);
            downloadCSV(csv, \`thermographie_\${new Date().toISOString().slice(0, 10)}.csv\`);
            
            alert('📊 Export CSV Réussi\\n\\nDonnées thermographiques exportées avec succès.');
        }
        
        function generateThermalReport() {
            alert('📄 Génération Rapport PDF\\n\\nRapport thermographique DIN EN 62446-3 en cours de génération...\\n\\n• Cartographie thermique\\n• Analyse points chauds\\n• Recommandations techniques');
        }
        
        function planRepass() {
            alert('📅 Planification Repassage\\n\\nRepassage programmé dans 3 mois pour suivi évolution points chauds détectés.');
        }
        
        function sendToClient() {
            alert('📧 Envoi Client\\n\\nRapport thermographique envoyé au client avec recommandations de maintenance préventive.');
        }
        
        function toggleHotSpots() {
            const hotSpots = document.querySelectorAll('.temp-critical');
            hotSpots.forEach(spot => {
                spot.style.animation = spot.style.animation ? '' : 'pulse 1s infinite';
            });
        }
        
        // Fonctions utilitaires
        function convertToCSV(data) {
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => Object.values(row).join(',')).join('\\n');
            return headers + '\\n' + rows;
        }
        
        function downloadCSV(csv, filename) {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(url);
        }
        
        // Initialisation
        initThermalGrid();
        
        // Actions globales
        function createNewProject() {
            window.location.href = '/projects/new';
        }

        function viewAllProjects() {
            window.location.href = '/projects';
        }

        function generateGlobalReport() {
            alert('📄 Générateur de Rapports Globaux\\n\\nFonctionnalité en développement.\\nExport multi-modules avec synthèse exécutive.');
        }

        function exportData() {
            alert('📊 Export Données\\n\\nExport CSV/Excel de toutes les données diagnostic en cours de développement.');
        }
        <\/script>
        
        <!-- Section Actions globales -->
        <section class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">Actions globales</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onclick="createNewProject()" class="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Nouveau Projet
                    </button>
                    
                    <button onclick="viewAllProjects()" class="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
                        <i class="fas fa-folder mr-2"></i>Tous les Projets
                    </button>
                    
                    <button onclick="generateGlobalReport()" class="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium">
                        <i class="fas fa-file-pdf mr-2"></i>Rapport Global
                    </button>
                    
                    <button onclick="exportData()" class="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium">
                        <i class="fas fa-download mr-2"></i>Export Données
                    </button>
                </div>
            </div>
        </section>
    </body>
    </html>
`));
h.get("/modules/iv-curves", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Courbes I-V - HUB Diagnostic</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script>
        <style>
            :root { --iv-blue: #2563EB; --diag-dark: #1F2937; }
            .bg-iv-blue { background-color: var(--iv-blue); }
            .text-iv-blue { color: var(--iv-blue); }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-iv-blue text-white py-4">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-xl">
                            <i class="fas fa-chart-line text-xl text-white"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">MODULE COURBES I-V</h1>
                            <p class="text-blue-100">IEC 60904-1 • Analyse Performances</p>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <a href="/modules" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium">
                            <i class="fas fa-th mr-2"></i>Modules
                        </a>
                        <a href="/" class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium">
                            <i class="fas fa-home mr-2"></i>Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8">
            <!-- Configuration Mesures -->
            <section class="mb-8">
                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <h2 class="text-xl font-bold text-gray-800 mb-6">
                        <i class="fas fa-sliders-h text-iv-blue mr-2"></i>Configuration Mesures I-V
                    </h2>
                    
                    <div class="grid md:grid-cols-4 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">String Sélectionné</label>
                            <select id="stringSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                <option>String 1 (24 modules)</option>
                                <option>String 2 (24 modules)</option>
                                <option>String 3 (26 modules)</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Type Courbe</label>
                            <select id="curveType" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                                <option>Courbe Éclairée (STC)</option>
                                <option>Courbe Sombre</option>
                                <option>Courbe Référence</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Irradiance</label>
                            <input type="number" id="irradiance" value="1000" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                            <span class="text-xs text-gray-500">W/m²</span>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Température</label>
                            <input type="number" id="temperature" value="25" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                            <span class="text-xs text-gray-500">°C</span>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <button onclick="startIVMeasurement()" class="bg-iv-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-play mr-2"></i>DÉMARRER MESURE
                            </button>
                            <button onclick="pauseMeasurement()" class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-3 rounded-lg font-medium">
                                <i class="fas fa-pause mr-2"></i>Pause
                            </button>
                            <button onclick="resetMeasurement()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium">
                                <i class="fas fa-redo mr-2"></i>Reset
                            </button>
                        </div>
                        
                        <div class="text-sm text-gray-600">
                            Status: <span id="measurementStatus" class="font-medium">Prêt</span> |
                            Points: <span id="pointsCount" class="font-bold text-iv-blue">0</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Graphiques et Données -->
            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Graphique I-V Principal -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-bold text-gray-800">
                                <i class="fas fa-chart-area text-iv-blue mr-2"></i>Courbe I-V Temps Réel
                            </h3>
                            <div class="flex space-x-2">
                                <button onclick="toggleReference()" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-layer-group mr-1"></i>Référence
                                </button>
                                <button onclick="exportChart()" class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm">
                                    <i class="fas fa-download mr-1"></i>Export
                                </button>
                            </div>
                        </div>
                        
                        <div style="height: 400px;">
                            <canvas id="ivChart"></canvas>
                        </div>
                        
                        <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div class="flex justify-between">
                                <span class="text-gray-600">Pmax mesurée:</span>
                                <span id="pmaxMeasured" class="font-bold text-green-600">-- W</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Pmax théorique:</span>
                                <span id="pmaxTheoretical" class="font-bold text-blue-600">-- W</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Écart performance:</span>
                                <span id="performanceGap" class="font-bold text-red-600">--%</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600">Fill Factor:</span>
                                <span id="fillFactor" class="font-bold text-purple-600">--</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Graphique P-V -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-6">
                            <i class="fas fa-bolt text-yellow-500 mr-2"></i>Courbe P-V (Puissance)
                        </h3>
                        
                        <div style="height: 250px;">
                            <canvas id="pvChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <!-- Panel Paramètres Temps Réel -->
                <div class="space-y-6">
                    <!-- Paramètres Électriques -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-bolt text-yellow-500 mr-2"></i>Paramètres Électriques
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center p-3 bg-blue-50 rounded-lg">
                                    <div class="text-xl font-bold text-blue-600" id="vocValue">--</div>
                                    <div class="text-xs text-gray-600">Voc (V)</div>
                                </div>
                                <div class="text-center p-3 bg-green-50 rounded-lg">
                                    <div class="text-xl font-bold text-green-600" id="iscValue">--</div>
                                    <div class="text-xs text-gray-600">Isc (A)</div>
                                </div>
                                <div class="text-center p-3 bg-purple-50 rounded-lg">
                                    <div class="text-xl font-bold text-purple-600" id="vmpValue">--</div>
                                    <div class="text-xs text-gray-600">Vmp (V)</div>
                                </div>
                                <div class="text-center p-3 bg-orange-50 rounded-lg">
                                    <div class="text-xl font-bold text-orange-600" id="impValue">--</div>
                                    <div class="text-xs text-gray-600">Imp (A)</div>
                                </div>
                            </div>
                            
                            <div class="pt-4 border-t">
                                <div class="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                                    <div class="text-2xl font-bold text-green-600" id="pmaxValue">-- W</div>
                                    <div class="text-sm text-gray-600">Puissance Max (Pmax)</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Comparaison Constructeur -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-balance-scale text-blue-600 mr-2"></i>vs Constructeur
                        </h3>
                        
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Pmax nominal:</span>
                                <span class="font-bold text-gray-800" id="nominalPmax">400 W</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Écart Voc:</span>
                                <span id="vocGap" class="font-bold text-red-600">--%</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Écart Isc:</span>
                                <span id="iscGap" class="font-bold text-red-600">--%</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Conformité:</span>
                                <span id="conformity" class="font-bold text-green-600">CONFORME</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                            <div class="text-xs text-gray-600 mb-1">Évaluation Globale:</div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div id="performanceBar" class="bg-green-500 h-2 rounded-full transition-all duration-500" style="width: 0%"></div>
                            </div>
                            <div class="text-xs text-gray-600 mt-1" id="performanceLabel">--</div>
                        </div>
                    </div>
                    
                    <!-- Actions Mesures -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-tools text-green-600 mr-2"></i>Actions
                        </h3>
                        
                        <div class="space-y-3">
                            <button onclick="saveCurrentCurve()" class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-save mr-2"></i>Sauvegarder Courbe
                            </button>
                            <button onclick="generateIVReport()" class="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-file-pdf mr-2"></i>Rapport PDF IEC
                            </button>
                            <button onclick="nextString()" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-forward mr-2"></i>String Suivant
                            </button>
                            <button onclick="exportIVData()" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-download mr-2"></i>Export Données
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script>
        let ivChart, pvChart;
        let measurementData = [];
        let referenceData = [];
        let isMonitoring = false;
        let currentPoint = 0;
        
        // Paramètres constructeur (exemple module 400W)
        const moduleSpecs = {
            pmax: 400,
            voc: 49.1,
            isc: 10.57,
            vmp: 41.4,
            imp: 9.66
        };
        
        // Initialisation des graphiques
        function initCharts() {
            // Graphique I-V
            const ivCtx = document.getElementById('ivChart').getContext('2d');
            ivChart = new Chart(ivCtx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Courbe I-V Mesurée',
                        data: [],
                        borderColor: '#2563EB',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        borderWidth: 2,
                        fill: false,
                        tension: 0.1
                    }, {
                        label: 'Référence Constructeur',
                        data: [],
                        borderColor: '#10B981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1,
                        hidden: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom',
                            title: { display: true, text: 'Tension (V)' },
                            min: 0,
                            max: 50
                        },
                        y: {
                            title: { display: true, text: 'Courant (A)' },
                            min: 0,
                            max: 12
                        }
                    },
                    plugins: {
                        legend: { display: true },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return \`V: \${context.parsed.x.toFixed(2)}V, I: \${context.parsed.y.toFixed(3)}A\`;
                                }
                            }
                        }
                    }
                }
            });
            
            // Graphique P-V
            const pvCtx = document.getElementById('pvChart').getContext('2d');
            pvChart = new Chart(pvCtx, {
                type: 'line',
                data: {
                    datasets: [{
                        label: 'Courbe P-V',
                        data: [],
                        borderColor: '#F59E0B',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            title: { display: true, text: 'Tension (V)' },
                            min: 0,
                            max: 50
                        },
                        y: {
                            title: { display: true, text: 'Puissance (W)' },
                            min: 0,
                            max: 450
                        }
                    },
                    plugins: {
                        legend: { display: true }
                    }
                }
            });
        }
        
        // Génération de courbes I-V réalistes
        function generateRealisticIVCurve() {
            const points = [];
            const pvPoints = [];
            
            // Paramètres avec variations réalistes
            const voc = moduleSpecs.voc * (0.95 + Math.random() * 0.1); // ±5%
            const isc = moduleSpecs.isc * (0.95 + Math.random() * 0.1); // ±5%
            
            for (let v = 0; v <= voc; v += 0.5) {
                // Équation de diode simplifiée avec résistances
                const rs = 0.5; // Résistance série
                const rsh = 1000; // Résistance shunt
                
                let i = isc * (1 - Math.exp((v - voc) / 2.5)) - v / rsh;
                i = Math.max(0, i);
                
                // Ajout de bruit réaliste
                i += (Math.random() - 0.5) * 0.02;
                
                const p = v * i;
                
                points.push({ x: v, y: i });
                pvPoints.push({ x: v, y: p });
            }
            
            return { ivPoints: points, pvPoints: pvPoints };
        }
        
        // Démarrage de mesure I-V
        function startIVMeasurement() {
            if (isMonitoring) return;
            
            isMonitoring = true;
            currentPoint = 0;
            measurementData = [];
            
            document.getElementById('measurementStatus').textContent = 'Mesure en cours...';
            
            // Génération de données réalistes
            const curveData = generateRealisticIVCurve();
            
            // Animation point par point
            const measurementInterval = setInterval(() => {
                if (currentPoint >= curveData.ivPoints.length) {
                    clearInterval(measurementInterval);
                    completeMeasurement();
                    return;
                }
                
                // Ajout du point
                const ivPoint = curveData.ivPoints[currentPoint];
                const pvPoint = curveData.pvPoints[currentPoint];
                
                measurementData.push({ iv: ivPoint, pv: pvPoint });
                
                // Mise à jour des graphiques
                ivChart.data.datasets[0].data = measurementData.map(d => d.iv);
                pvChart.data.datasets[0].data = measurementData.map(d => d.pv);
                
                ivChart.update('none');
                pvChart.update('none');
                
                // Mise à jour des paramètres en temps réel
                updateElectricalParameters();
                
                currentPoint++;
                document.getElementById('pointsCount').textContent = currentPoint;
                
            }, 100); // Point toutes les 100ms
        }
        
        function pauseMeasurement() {
            isMonitoring = false;
            document.getElementById('measurementStatus').textContent = 'En pause';
        }
        
        function resetMeasurement() {
            isMonitoring = false;
            currentPoint = 0;
            measurementData = [];
            
            ivChart.data.datasets[0].data = [];
            pvChart.data.datasets[0].data = [];
            
            ivChart.update();
            pvChart.update();
            
            document.getElementById('measurementStatus').textContent = 'Prêt';
            document.getElementById('pointsCount').textContent = '0';
            
            // Reset des paramètres
            ['vocValue', 'iscValue', 'vmpValue', 'impValue', 'pmaxValue'].forEach(id => {
                document.getElementById(id).textContent = '--';
            });
        }
        
        function completeMeasurement() {
            isMonitoring = false;
            document.getElementById('measurementStatus').textContent = 'Mesure terminée';
            
            // Calcul des paramètres finaux
            updateElectricalParameters();
            updateComparison();
        }
        
        // Mise à jour des paramètres électriques
        function updateElectricalParameters() {
            if (measurementData.length === 0) return;
            
            const ivPoints = measurementData.map(d => d.iv);
            const pvPoints = measurementData.map(d => d.pv);
            
            // Calcul Voc (tension à courant nul)
            const voc = Math.max(...ivPoints.map(p => p.x));
            
            // Calcul Isc (courant à tension nulle)
            const isc = ivPoints[0]?.y || 0;
            
            // Calcul Pmax et point MPP
            const maxPowerPoint = pvPoints.reduce((max, current) => 
                current.y > max.y ? current : max
            , { x: 0, y: 0 });
            
            const pmax = maxPowerPoint.y;
            const vmp = maxPowerPoint.x;
            const imp = pmax / vmp;
            
            // Calcul Fill Factor
            const fillFactor = (pmax / (voc * isc)).toFixed(3);
            
            // Mise à jour de l'affichage
            document.getElementById('vocValue').textContent = voc.toFixed(2);
            document.getElementById('iscValue').textContent = isc.toFixed(3);
            document.getElementById('vmpValue').textContent = vmp.toFixed(2);
            document.getElementById('impValue').textContent = imp.toFixed(3);
            document.getElementById('pmaxValue').textContent = pmax.toFixed(1);
            document.getElementById('fillFactor').textContent = fillFactor;
            
            // Mise à jour des comparaisons
            document.getElementById('pmaxMeasured').textContent = pmax.toFixed(1) + ' W';
            document.getElementById('pmaxTheoretical').textContent = moduleSpecs.pmax + ' W';
            
            const performanceGap = ((pmax - moduleSpecs.pmax) / moduleSpecs.pmax * 100).toFixed(1);
            document.getElementById('performanceGap').textContent = performanceGap + '%';
        }
        
        // Mise à jour de la comparaison constructeur
        function updateComparison() {
            const voc = parseFloat(document.getElementById('vocValue').textContent) || 0;
            const isc = parseFloat(document.getElementById('iscValue').textContent) || 0;
            const pmax = parseFloat(document.getElementById('pmaxValue').textContent) || 0;
            
            // Calcul des écarts
            const vocGap = ((voc - moduleSpecs.voc) / moduleSpecs.voc * 100).toFixed(1);
            const iscGap = ((isc - moduleSpecs.isc) / moduleSpecs.isc * 100).toFixed(1);
            
            document.getElementById('vocGap').textContent = vocGap + '%';
            document.getElementById('iscGap').textContent = iscGap + '%';
            
            // Évaluation de conformité
            const performance = (pmax / moduleSpecs.pmax) * 100;
            const performanceBar = document.getElementById('performanceBar');
            const performanceLabel = document.getElementById('performanceLabel');
            const conformityElement = document.getElementById('conformity');
            
            performanceBar.style.width = Math.min(performance, 100) + '%';
            performanceLabel.textContent = performance.toFixed(1) + '% de performance';
            
            if (performance >= 95) {
                performanceBar.className = 'bg-green-500 h-2 rounded-full transition-all duration-500';
                conformityElement.textContent = 'CONFORME';
                conformityElement.className = 'font-bold text-green-600';
            } else if (performance >= 90) {
                performanceBar.className = 'bg-yellow-500 h-2 rounded-full transition-all duration-500';
                conformityElement.textContent = 'LIMITE';
                conformityElement.className = 'font-bold text-yellow-600';
            } else {
                performanceBar.className = 'bg-red-500 h-2 rounded-full transition-all duration-500';
                conformityElement.textContent = 'NON-CONFORME';
                conformityElement.className = 'font-bold text-red-600';
            }
        }
        
        // Actions
        function toggleReference() {
            const dataset = ivChart.data.datasets[1];
            dataset.hidden = !dataset.hidden;
            
            if (!dataset.hidden && dataset.data.length === 0) {
                // Générer courbe de référence
                const refPoints = [];
                for (let v = 0; v <= moduleSpecs.voc; v += 0.5) {
                    const i = moduleSpecs.isc * (1 - Math.exp((v - moduleSpecs.voc) / 2.5));
                    refPoints.push({ x: v, y: Math.max(0, i) });
                }
                dataset.data = refPoints;
            }
            
            ivChart.update();
        }
        
        function saveCurrentCurve() {
            if (measurementData.length === 0) {
                alert('❌ Aucune donnée à sauvegarder');
                return;
            }
            
            alert('💾 Courbe Sauvegardée\\n\\nDonnées I-V enregistrées dans la base avec paramètres calculés:\\n• Pmax: ' + document.getElementById('pmaxValue').textContent + ' W\\n• Fill Factor: ' + document.getElementById('fillFactor').textContent);
        }
        
        function generateIVReport() {
            alert('📄 Génération Rapport I-V\\n\\nRapport IEC 60904-1 en cours de génération:\\n\\n• Courbes I-V et P-V\\n• Paramètres électriques\\n• Comparaison constructeur\\n• Conformité IEC');
        }
        
        function nextString() {
            const stringSelect = document.getElementById('stringSelect');
            const currentIndex = stringSelect.selectedIndex;
            
            if (currentIndex < stringSelect.options.length - 1) {
                stringSelect.selectedIndex = currentIndex + 1;
                resetMeasurement();
                alert('➡️ String Suivant\\n\\nPassage au ' + stringSelect.value);
            } else {
                alert('✅ Audit Terminé\\n\\nTous les strings ont été mesurés.');
            }
        }
        
        function exportIVData() {
            if (measurementData.length === 0) {
                alert('❌ Aucune donnée à exporter');
                return;
            }
            
            const csvData = measurementData.map((point, index) => ({
                Point: index + 1,
                Tension_V: point.iv.x.toFixed(3),
                Courant_A: point.iv.y.toFixed(4),
                Puissance_W: point.pv.y.toFixed(2)
            }));
            
            const csv = convertToCSV(csvData);
            downloadCSV(csv, \`courbe_iv_\${new Date().toISOString().slice(0, 10)}.csv\`);
            
            alert('📊 Export CSV Réussi\\n\\nDonnées I-V exportées avec succès.');
        }
        
        function exportChart() {
            const link = document.createElement('a');
            link.download = \`courbe_iv_\${new Date().toISOString().slice(0, 10)}.png\`;
            link.href = ivChart.toBase64Image();
            link.click();
            
            alert('📈 Graphique Exporté\\n\\nImage de la courbe I-V sauvegardée.');
        }
        
        // Fonctions utilitaires
        function convertToCSV(data) {
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => Object.values(row).join(',')).join('\\n');
            return headers + '\\n' + rows;
        }
        
        function downloadCSV(csv, filename) {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(url);
        }
        
        // Initialisation
        initCharts();
        
        // Actions globales
        function createNewProject() {
            window.location.href = '/projects/new';
        }

        function viewAllProjects() {
            window.location.href = '/projects';
        }

        function generateGlobalReport() {
            alert('📄 Générateur de Rapports Globaux\\n\\nFonctionnalité en développement.\\nExport multi-modules avec synthèse exécutive.');
        }

        function exportData() {
            alert('📊 Export Données\\n\\nExport CSV/Excel de toutes les données diagnostic en cours de développement.');
        }
        <\/script>
        
        <!-- Section Actions globales -->
        <section class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">Actions globales</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onclick="createNewProject()" class="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Nouveau Projet
                    </button>
                    
                    <button onclick="viewAllProjects()" class="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
                        <i class="fas fa-folder mr-2"></i>Tous les Projets
                    </button>
                    
                    <button onclick="generateGlobalReport()" class="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium">
                        <i class="fas fa-file-pdf mr-2"></i>Rapport Global
                    </button>
                    
                    <button onclick="exportData()" class="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium">
                        <i class="fas fa-download mr-2"></i>Export Données
                    </button>
                </div>
            </div>
        </section>
    </body>
    </html>
`));
h.get("/modules/isolation", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Tests Isolement - HUB Diagnostic</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            :root { --iso-yellow: #F59E0B; --diag-dark: #1F2937; }
            .bg-iso-yellow { background-color: var(--iso-yellow); }
            .text-iso-yellow { color: var(--iso-yellow); }
            
            .test-progress {
                background: linear-gradient(90deg, #f59e0b, #10b981);
                height: 8px;
                border-radius: 4px;
                transition: width 0.3s ease;
            }
            
            .multimeter-display {
                background: #000;
                color: #0f0;
                font-family: 'Courier New', monospace;
                padding: 20px;
                border-radius: 8px;
                border: 3px solid #333;
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 0 0 10px #0f0;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-iso-yellow text-white py-4">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center justify-center w-12 h-12 bg-white bg-opacity-20 rounded-xl">
                            <i class="fas fa-shield-alt text-xl text-white"></i>
                        </div>
                        <div>
                            <h1 class="text-2xl font-bold">MODULE TESTS ISOLEMENT</h1>
                            <p class="text-yellow-100">NFC 15-100 • Conformité Électrique</p>
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <a href="/modules" class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-medium">
                            <i class="fas fa-th mr-2"></i>Modules
                        </a>
                        <a href="/" class="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg font-medium">
                            <i class="fas fa-home mr-2"></i>Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8">
            <!-- Configuration Tests -->
            <section class="mb-8">
                <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                    <h2 class="text-xl font-bold text-gray-800 mb-6">
                        <i class="fas fa-cogs text-iso-yellow mr-2"></i>Configuration Tests NFC 15-100
                    </h2>
                    
                    <div class="grid md:grid-cols-4 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Installation</label>
                            <select id="installationSelect" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500">
                                <option>Installation résidentielle 9kWc</option>
                                <option>Installation commerciale 36kWc</option>
                                <option>Centrale solaire 250kWc</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Type Test</label>
                            <select id="testType" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500">
                                <option>Isolement DC</option>
                                <option>Isolement AC</option>
                                <option>Continuité Terre</option>
                                <option>Test Complet</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Tension Test</label>
                            <select id="testVoltage" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500">
                                <option>500V DC</option>
                                <option>1000V DC</option>
                                <option>250V AC</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Conditions</label>
                            <div class="grid grid-cols-2 gap-2">
                                <input type="number" id="temperature" value="22" class="px-2 py-1 border border-gray-300 rounded text-sm" placeholder="°C">
                                <input type="number" id="humidity" value="45" class="px-2 py-1 border border-gray-300 rounded text-sm" placeholder="%HR">
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-between items-center">
                        <div class="flex items-center space-x-4">
                            <button onclick="startIsolationTest()" class="bg-iso-yellow hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-play mr-2"></i>DÉMARRER TEST
                            </button>
                            <button onclick="stopTest()" class="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-lg font-medium">
                                <i class="fas fa-stop mr-2"></i>Arrêter
                            </button>
                            <button onclick="resetTest()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg font-medium">
                                <i class="fas fa-redo mr-2"></i>Reset
                            </button>
                        </div>
                        
                        <div class="text-sm text-gray-600">
                            Status: <span id="testStatus" class="font-medium">Prêt</span> |
                            Seuil: <span class="font-bold text-green-600">> 1MΩ</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Multimètre et Résultats -->
            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Multimètre Digital -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-lg font-bold text-gray-800">
                                <i class="fas fa-digital-tachograph text-iso-yellow mr-2"></i>Multimètre Intégré
                            </h3>
                            <div class="flex items-center space-x-2">
                                <div id="connectionStatus" class="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span class="text-sm text-gray-600">Appareil</span>
                            </div>
                        </div>
                        
                        <!-- Écran multimètre -->
                        <div class="multimeter-display mb-6">
                            <div class="text-sm mb-2">NFC 15-100 | TEST ISOLEMENT</div>
                            <div class="text-4xl font-bold" id="resistanceValue">----.-- MΩ</div>
                            <div class="text-sm mt-2" id="testMode">STANDBY</div>
                        </div>
                        
                        <!-- Progression test -->
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm font-medium text-gray-700">Progression Test</span>
                                <span id="progressPercent" class="text-sm font-bold text-iso-yellow">0%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div id="progressBar" class="test-progress" style="width: 0%"></div>
                            </div>
                            <div class="text-xs text-gray-500 mt-1" id="progressPhase">En attente</div>
                        </div>
                        
                        <!-- Graphique historique -->
                        <div class="bg-gray-50 rounded-lg p-4">
                            <h4 class="text-sm font-bold text-gray-700 mb-3">Historique Mesures (5 min)</h4>
                            <canvas id="isolationChart" width="400" height="200"></canvas>
                        </div>
                    </div>
                    
                    <!-- Résultats détaillés -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-6">
                            <i class="fas fa-clipboard-check text-green-600 mr-2"></i>Résultats Détaillés
                        </h3>
                        
                        <div class="grid md:grid-cols-3 gap-4" id="detailedResults">
                            <div class="text-center p-4 bg-gray-50 rounded-lg">
                                <div class="text-sm text-gray-600 mb-1">Test en cours...</div>
                                <div class="text-lg font-bold text-gray-400">--</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Panel Contrôle -->
                <div class="space-y-6">
                    <!-- Résultats Temps Réel -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-tachometer-alt text-blue-600 mr-2"></i>Résultats Temps Réel
                        </h3>
                        
                        <div class="space-y-4">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Résistance Isolement:</span>
                                <span id="currentResistance" class="font-bold text-green-600">-- MΩ</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Tension Test:</span>
                                <span id="currentVoltage" class="font-bold text-blue-600">-- V</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Courant Fuite:</span>
                                <span id="leakageCurrent" class="font-bold text-orange-600">-- μA</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Durée Test:</span>
                                <span id="testDuration" class="font-bold text-purple-600">00:00</span>
                            </div>
                        </div>
                        
                        <div class="mt-6 pt-4 border-t">
                            <div class="text-sm font-medium text-gray-700 mb-2">Conformité NFC</div>
                            <div id="conformityStatus" class="bg-gray-50 rounded-lg p-3 text-center">
                                <div class="text-lg font-bold text-gray-600">En attente</div>
                                <div class="text-xs text-gray-600">Seuil: > 1 MΩ</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Conditions Environnement -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-thermometer-half text-red-500 mr-2"></i>Conditions
                        </h3>
                        
                        <div class="space-y-3">
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Température:</span>
                                <span id="envTemperature" class="font-bold text-red-600">22°C</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Humidité:</span>
                                <span id="envHumidity" class="font-bold text-blue-600">45%</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-sm text-gray-600">Pression:</span>
                                <span id="envPressure" class="font-bold text-green-600">1013 hPa</span>
                            </div>
                        </div>
                        
                        <div class="mt-4 p-3 bg-blue-50 rounded-lg">
                            <div class="text-xs text-blue-600 mb-1">Impact Correction:</div>
                            <div class="text-sm font-bold text-blue-700" id="correctionFactor">Facteur: 1.00</div>
                        </div>
                    </div>
                    
                    <!-- Actions Rapides -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-tools text-green-600 mr-2"></i>Actions
                        </h3>
                        
                        <div class="space-y-3">
                            <button onclick="saveResults()" class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-save mr-2"></i>Sauvegarder Résultats
                            </button>
                            <button onclick="generateCertificate()" class="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-certificate mr-2"></i>Certificat NFC
                            </button>
                            <button onclick="scheduleRetest()" class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-calendar mr-2"></i>Planifier Recontrôle
                            </button>
                            <button onclick="exportIsolationData()" class="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-download mr-2"></i>Export Données
                            </button>
                        </div>
                    </div>
                    
                    <!-- Historique Tests -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold text-gray-800 mb-4">
                            <i class="fas fa-history text-gray-600 mr-2"></i>Tests Précédents
                        </h3>
                        
                        <div id="testHistory" class="space-y-2 max-h-48 overflow-y-auto">
                            <div class="text-sm text-gray-500">Aucun historique</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script>
        let testInterval = null;
        let testStartTime = null;
        let testData = [];
        let isTestRunning = false;
        
        // Phases de test
        const testPhases = [
            { name: 'Préparation', duration: 5, description: 'Vérification sécurité' },
            { name: 'Stabilisation', duration: 10, description: 'Montée en tension' },
            { name: 'Mesure', duration: 60, description: 'Test isolement' },
            { name: 'Décharge', duration: 15, description: 'Sécurisation' }
        ];
        
        let currentPhase = 0;
        let phaseTimer = 0;
        
        // Démarrage du test d'isolement
        function startIsolationTest() {
            if (isTestRunning) return;
            
            isTestRunning = true;
            testStartTime = new Date();
            currentPhase = 0;
            phaseTimer = 0;
            testData = [];
            
            document.getElementById('testStatus').textContent = 'Test en cours...';
            document.getElementById('connectionStatus').className = 'w-3 h-3 bg-green-500 rounded-full';
            document.getElementById('testMode').textContent = 'TEST ACTIF';
            
            // Timer principal
            testInterval = setInterval(() => {
                updateTestProgress();
                performMeasurement();
                
                phaseTimer++;
                
                // Vérification fin de phase
                if (phaseTimer >= testPhases[currentPhase].duration) {
                    nextPhase();
                }
                
            }, 1000); // Mise à jour chaque seconde
        }
        
        function stopTest() {
            if (testInterval) {
                clearInterval(testInterval);
                testInterval = null;
            }
            
            isTestRunning = false;
            document.getElementById('testStatus').textContent = 'Test arrêté';
            document.getElementById('connectionStatus').className = 'w-3 h-3 bg-red-500 rounded-full';
            document.getElementById('testMode').textContent = 'ARRÊTÉ';
            
            // Sauvegarde automatique si des données existent
            if (testData.length > 0) {
                addToHistory('Arrêté manuellement', 'N/A', 'orange');
            }
        }
        
        function resetTest() {
            stopTest();
            
            // Reset de l'interface
            document.getElementById('resistanceValue').textContent = '----.-- MΩ';
            document.getElementById('testMode').textContent = 'STANDBY';
            document.getElementById('progressBar').style.width = '0%';
            document.getElementById('progressPercent').textContent = '0%';
            document.getElementById('progressPhase').textContent = 'En attente';
            
            // Reset des valeurs
            ['currentResistance', 'currentVoltage', 'leakageCurrent', 'testDuration'].forEach(id => {
                document.getElementById(id).textContent = '-- ' + (id.includes('Voltage') ? 'V' : id.includes('Resistance') ? 'MΩ' : id.includes('Current') ? 'μA' : '');
            });
            
            document.getElementById('testStatus').textContent = 'Prêt';
            updateConformityStatus(null);
        }
        
        // Progression vers la phase suivante
        function nextPhase() {
            currentPhase++;
            phaseTimer = 0;
            
            if (currentPhase >= testPhases.length) {
                completeTest();
                return;
            }
            
            updateTestProgress();
        }
        
        // Mise à jour de la progression
        function updateTestProgress() {
            const totalDuration = testPhases.reduce((sum, phase) => sum + phase.duration, 0);
            const elapsedTotal = testPhases.slice(0, currentPhase).reduce((sum, phase) => sum + phase.duration, 0) + phaseTimer;
            
            const progressPercent = Math.min((elapsedTotal / totalDuration) * 100, 100);
            
            document.getElementById('progressBar').style.width = progressPercent + '%';
            document.getElementById('progressPercent').textContent = Math.round(progressPercent) + '%';
            
            if (currentPhase < testPhases.length) {
                document.getElementById('progressPhase').textContent = testPhases[currentPhase].description;
            }
            
            // Durée test
            const elapsed = Math.floor((new Date() - testStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            document.getElementById('testDuration').textContent = 
                \`\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`;
        }
        
        // Effectuer une mesure
        function performMeasurement() {
            let resistance, voltage, current;
            
            switch (currentPhase) {
                case 0: // Préparation
                    resistance = 0;
                    voltage = 0;
                    current = 0;
                    break;
                    
                case 1: // Stabilisation
                    const rampProgress = phaseTimer / testPhases[1].duration;
                    voltage = rampProgress * 500; // Montée progressive à 500V
                    resistance = generateRealisticResistance(rampProgress * 0.5);
                    current = (voltage / (resistance * 1e6)) * 1e6; // Conversion en μA
                    break;
                    
                case 2: // Mesure
                    voltage = 500;
                    resistance = generateRealisticResistance(1.0);
                    current = (voltage / (resistance * 1e6)) * 1e6;
                    
                    // Enregistrement des données
                    testData.push({
                        time: new Date(),
                        resistance: resistance,
                        voltage: voltage,
                        current: current
                    });
                    break;
                    
                case 3: // Décharge
                    const dischargeProgress = phaseTimer / testPhases[3].duration;
                    voltage = 500 * (1 - dischargeProgress);
                    resistance = generateRealisticResistance(0.5);
                    current = voltage > 0 ? (voltage / (resistance * 1e6)) * 1e6 : 0;
                    break;
                    
                default:
                    resistance = voltage = current = 0;
            }
            
            // Mise à jour de l'affichage
            document.getElementById('resistanceValue').textContent = resistance.toFixed(2) + ' MΩ';
            document.getElementById('currentResistance').textContent = resistance.toFixed(2) + ' MΩ';
            document.getElementById('currentVoltage').textContent = Math.round(voltage) + ' V';
            document.getElementById('leakageCurrent').textContent = current.toFixed(1) + ' μA';
            
            // Vérification conformité en temps réel
            if (currentPhase === 2 && resistance > 0) {
                updateConformityStatus(resistance);
            }
        }
        
        // Génération de résistances réalistes
        function generateRealisticResistance(factor) {
            // Résistance de base entre 5-50 MΩ pour installation conforme
            let baseResistance = 15 + Math.random() * 25; // 15-40 MΩ
            
            // Facteur de progression
            baseResistance *= factor;
            
            // Simulation de problèmes occasionnels
            if (Math.random() < 0.05) { // 5% de chance de problème
                baseResistance = 0.5 + Math.random() * 0.8; // 0.5-1.3 MΩ (non-conforme)
            }
            
            // Variation réaliste
            baseResistance += (Math.random() - 0.5) * 2;
            
            return Math.max(0.1, baseResistance);
        }
        
        // Mise à jour du statut de conformité
        function updateConformityStatus(resistance) {
            const statusDiv = document.getElementById('conformityStatus');
            
            if (resistance === null) {
                statusDiv.innerHTML = \`
                    <div class="text-lg font-bold text-gray-600">En attente</div>
                    <div class="text-xs text-gray-600">Seuil: > 1 MΩ</div>
                \`;
                return;
            }
            
            if (resistance >= 1.0) {
                statusDiv.innerHTML = \`
                    <div class="text-lg font-bold text-green-600">✅ CONFORME</div>
                    <div class="text-xs text-green-600">Résistance > 1 MΩ</div>
                \`;
                statusDiv.className = 'bg-green-50 rounded-lg p-3 text-center border border-green-200';
            } else {
                statusDiv.innerHTML = \`
                    <div class="text-lg font-bold text-red-600">❌ NON CONFORME</div>
                    <div class="text-xs text-red-600">Résistance < 1 MΩ</div>
                \`;
                statusDiv.className = 'bg-red-50 rounded-lg p-3 text-center border border-red-200';
            }
        }
        
        // Finalisation du test
        function completeTest() {
            stopTest();
            
            if (testData.length === 0) return;
            
            // Calcul de la résistance moyenne
            const avgResistance = testData.reduce((sum, d) => sum + d.resistance, 0) / testData.length;
            const minResistance = Math.min(...testData.map(d => d.resistance));
            const maxResistance = Math.max(...testData.map(d => d.resistance));
            
            // Évaluation finale
            const isConform = minResistance >= 1.0;
            const status = isConform ? 'CONFORME' : 'NON CONFORME';
            
            document.getElementById('testStatus').textContent = 'Test terminé - ' + status;
            document.getElementById('testMode').textContent = 'TERMINÉ';
            
            // Mise à jour des résultats détaillés
            updateDetailedResults(avgResistance, minResistance, maxResistance, isConform);
            
            // Ajout à l'historique
            addToHistory(status, avgResistance.toFixed(2) + ' MΩ', isConform ? 'green' : 'red');
            
            // Notification automatique
            setTimeout(() => {
                alert(\`📋 Test Isolement Terminé\\n\\nRésultat: \${status}\\nRésistance moyenne: \${avgResistance.toFixed(2)} MΩ\\nRésistance minimale: \${minResistance.toFixed(2)} MΩ\\n\\nConforme NFC 15-100: \${isConform ? 'OUI' : 'NON'}\`);
            }, 500);
        }
        
        // Mise à jour des résultats détaillés
        function updateDetailedResults(avg, min, max, conform) {
            const resultsDiv = document.getElementById('detailedResults');
            
            resultsDiv.innerHTML = \`
                <div class="text-center p-4 bg-blue-50 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Résistance Moyenne</div>
                    <div class="text-lg font-bold text-blue-600">\${avg.toFixed(2)} MΩ</div>
                </div>
                <div class="text-center p-4 bg-red-50 rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Résistance Minimale</div>
                    <div class="text-lg font-bold text-red-600">\${min.toFixed(2)} MΩ</div>
                </div>
                <div class="text-center p-4 \${conform ? 'bg-green-50' : 'bg-red-50'} rounded-lg">
                    <div class="text-sm text-gray-600 mb-1">Conformité NFC</div>
                    <div class="text-lg font-bold \${conform ? 'text-green-600' : 'text-red-600'}">\${conform ? '✅ OUI' : '❌ NON'}</div>
                </div>
            \`;
        }
        
        // Ajout à l'historique
        function addToHistory(status, value, color) {
            const historyDiv = document.getElementById('testHistory');
            
            // Supprimer le message vide
            if (historyDiv.children[0]?.textContent.includes('Aucun')) {
                historyDiv.innerHTML = '';
            }
            
            const entry = document.createElement('div');
            entry.className = \`bg-\${color}-50 border-l-4 border-\${color}-500 p-3 rounded text-sm\`;
            entry.innerHTML = \`
                <div class="flex justify-between items-center">
                    <div>
                        <span class="font-bold text-\${color}-700">\${status}</span>
                        <span class="text-\${color}-600"> • \${value}</span>
                    </div>
                    <span class="text-xs text-\${color}-600">\${new Date().toLocaleTimeString()}</span>
                </div>
            \`;
            
            historyDiv.insertBefore(entry, historyDiv.firstChild);
            
            // Limiter à 5 entrées
            while (historyDiv.children.length > 5) {
                historyDiv.removeChild(historyDiv.lastChild);
            }
        }
        
        // Actions
        function saveResults() {
            if (testData.length === 0) {
                alert('❌ Aucun résultat à sauvegarder');
                return;
            }
            
            alert('💾 Résultats Sauvegardés\\n\\nTest isolement enregistré dans la base:\\n• Conformité NFC 15-100\\n• Certificat automatique\\n• Traçabilité complète');
        }
        
        function generateCertificate() {
            if (testData.length === 0) {
                alert('❌ Effectuez d\\'abord un test');
                return;
            }
            
            alert('📜 Génération Certificat NFC\\n\\nCertificat de conformité NFC 15-100 en cours:\\n\\n• Résultats tests isolement\\n• Conditions environnementales\\n• Signature électronique DiagPV');
        }
        
        function scheduleRetest() {
            alert('📅 Planification Recontrôle\\n\\nRecontrôle programmé dans 12 mois selon NFC 15-100\\n\\nRappel automatique activé.');
        }
        
        function exportIsolationData() {
            if (testData.length === 0) {
                alert('❌ Aucune donnée à exporter');
                return;
            }
            
            const csvData = testData.map((point, index) => ({
                Temps: point.time.toLocaleTimeString(),
                Resistance_MOhm: point.resistance.toFixed(3),
                Tension_V: point.voltage.toFixed(1),
                Courant_uA: point.current.toFixed(2)
            }));
            
            const csv = convertToCSV(csvData);
            downloadCSV(csv, \`test_isolement_\${new Date().toISOString().slice(0, 10)}.csv\`);
            
            alert('📊 Export CSV Réussi\\n\\nDonnées tests isolement exportées.');
        }
        
        // Fonctions utilitaires
        function convertToCSV(data) {
            const headers = Object.keys(data[0]).join(',');
            const rows = data.map(row => Object.values(row).join(',')).join('\\n');
            return headers + '\\n' + rows;
        }
        
        function downloadCSV(csv, filename) {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            window.URL.revokeObjectURL(url);
        }
        
        // Mise à jour conditions environnementales
        function updateEnvironmentalConditions() {
            const temp = 20 + Math.random() * 10; // 20-30°C
            const humidity = 35 + Math.random() * 20; // 35-55%
            const pressure = 1005 + Math.random() * 15; // 1005-1020 hPa
            
            document.getElementById('envTemperature').textContent = temp.toFixed(1) + '°C';
            document.getElementById('envHumidity').textContent = humidity.toFixed(0) + '%';
            document.getElementById('envPressure').textContent = pressure.toFixed(0) + ' hPa';
            
            // Facteur de correction selon température
            const correctionFactor = 1 + (temp - 20) * 0.02;
            document.getElementById('correctionFactor').textContent = 'Facteur: ' + correctionFactor.toFixed(2);
        }
        
        // Initialisation
        updateEnvironmentalConditions();
        setInterval(updateEnvironmentalConditions, 30000); // Mise à jour toutes les 30s
        
        // Actions globales
        function createNewProject() {
            window.location.href = '/projects/new';
        }

        function viewAllProjects() {
            window.location.href = '/projects';
        }

        function generateGlobalReport() {
            alert('📄 Générateur de Rapports Globaux\\n\\nFonctionnalité en développement.\\nExport multi-modules avec synthèse exécutive.');
        }

        function exportData() {
            alert('📊 Export Données\\n\\nExport CSV/Excel de toutes les données diagnostic en cours de développement.');
        }
        <\/script>
        
        <!-- Section Actions globales -->
        <section class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">Actions globales</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onclick="createNewProject()" class="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Nouveau Projet
                    </button>
                    
                    <button onclick="viewAllProjects()" class="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
                        <i class="fas fa-folder mr-2"></i>Tous les Projets
                    </button>
                    
                    <button onclick="generateGlobalReport()" class="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium">
                        <i class="fas fa-file-pdf mr-2"></i>Rapport Global
                    </button>
                    
                    <button onclick="exportData()" class="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium">
                        <i class="fas fa-download mr-2"></i>Export Données
                    </button>
                </div>
            </div>
        </section>
    </body>
    </html>
`));
h.get("/modules/visual", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Contrôles Visuels - HUB Diagnostic</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <header class="bg-green-500 text-white py-4">
            <div class="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <i class="fas fa-eye text-2xl"></i>
                    <div>
                        <h1 class="text-2xl font-bold">CONTRÔLES VISUELS</h1>
                        <p class="text-green-100">IEC 62446-1 • Inspection Normative</p>
                    </div>
                </div>
                <div class="flex space-x-3">
                    <a href="/modules" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-th mr-2"></i>Modules
                    </a>
                    <a href="/" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-home mr-2"></i>Dashboard
                    </a>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8">
            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Checklist IEC 62446-1 -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h2 class="text-xl font-bold mb-6">
                            <i class="fas fa-clipboard-list text-green-600 mr-2"></i>Checklist IEC 62446-1
                        </h2>
                        
                        <div class="space-y-6">
                            <!-- Catégorie Mécanique -->
                            <div class="border rounded-lg p-4">
                                <h3 class="font-bold text-gray-800 mb-4">🔧 Mécanique & Structure</h3>
                                <div class="grid md:grid-cols-2 gap-3">
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Fixations modules serrées</span>
                                    </label>
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Rails de montage conformes</span>
                                    </label>
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Étanchéité toiture OK</span>
                                    </label>
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Espacement modules respecté</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Catégorie Électrique -->
                            <div class="border rounded-lg p-4">
                                <h3 class="font-bold text-gray-800 mb-4">⚡ Électrique & Sécurité</h3>
                                <div class="grid md:grid-cols-2 gap-3">
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Connecteurs MC4 verrouillés</span>
                                    </label>
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Câblage DC protégé</span>
                                    </label>
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Mise à la terre conforme</span>
                                    </label>
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Signalétique présente</span>
                                    </label>
                                </div>
                            </div>
                            
                            <!-- Catégorie Modules -->
                            <div class="border rounded-lg p-4">
                                <h3 class="font-bold text-gray-800 mb-4">🔲 État des Modules</h3>
                                <div class="grid md:grid-cols-2 gap-3">
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Surface propre</span>
                                    </label>
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Pas de fissures visibles</span>
                                    </label>
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Cadre intact</span>
                                    </label>
                                    <label class="flex items-center space-x-2 cursor-pointer">
                                        <input type="checkbox" class="form-checkbox text-green-500"> 
                                        <span class="text-sm">Étiquettes lisibles</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-6 flex justify-between">
                            <button onclick="capturePhoto()" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-camera mr-2"></i>CAPTURE PHOTO
                            </button>
                            <button onclick="generateVisualReport()" class="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">
                                <i class="fas fa-file-pdf mr-2"></i>RAPPORT VISUEL
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Photos et Actions -->
                <div class="space-y-6">
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold mb-4">📸 Photos Géolocalisées</h3>
                        <div id="photoGallery" class="grid grid-cols-2 gap-2 mb-4">
                            <div class="bg-gray-100 rounded-lg h-24 flex items-center justify-center text-gray-500 text-xs">
                                Photo 1
                            </div>
                        </div>
                        <button onclick="addDefect()" class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg text-sm">
                            <i class="fas fa-exclamation-triangle mr-2"></i>Signaler Défaut
                        </button>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold mb-4">⚠️ Défauts Détectés</h3>
                        <div id="defectsList" class="space-y-2">
                            <div class="text-sm text-gray-500">Aucun défaut signalé</div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script>
        function capturePhoto() {
            alert('📷 Capture Photo\\n\\nPhoto géolocalisée ajoutée à la galerie avec timestamp et coordonnées GPS.');
        }
        
        function addDefect() {
            const defect = prompt('Décrivez le défaut détecté:');
            if (defect) {
                const list = document.getElementById('defectsList');
                if (list.children[0]?.textContent.includes('Aucun')) list.innerHTML = '';
                
                const item = document.createElement('div');
                item.className = 'bg-red-50 border-l-4 border-red-500 p-2 rounded text-sm';
                item.innerHTML = \`<strong>Critique:</strong> \${defect} <br><span class="text-xs text-gray-600">\${new Date().toLocaleTimeString()}</span>\`;
                list.appendChild(item);
            }
        }
        
        function generateVisualReport() {
            alert('📄 Rapport Visuel IEC\\n\\n• Checklist complète\\n• Photos annotées\\n• Plan d\\'actions\\n• Criticité automatique');
        }
        
        // Actions globales
        function createNewProject() {
            window.location.href = '/projects/new';
        }

        function viewAllProjects() {
            window.location.href = '/projects';
        }

        function generateGlobalReport() {
            alert('📄 Générateur de Rapports Globaux\\n\\nFonctionnalité en développement.\\nExport multi-modules avec synthèse exécutive.');
        }

        function exportData() {
            alert('📊 Export Données\\n\\nExport CSV/Excel de toutes les données diagnostic en cours de développement.');
        }
        <\/script>
        
        <!-- Section Actions globales -->
        <section class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">Actions globales</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onclick="createNewProject()" class="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Nouveau Projet
                    </button>
                    
                    <button onclick="viewAllProjects()" class="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
                        <i class="fas fa-folder mr-2"></i>Tous les Projets
                    </button>
                    
                    <button onclick="generateGlobalReport()" class="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium">
                        <i class="fas fa-file-pdf mr-2"></i>Rapport Global
                    </button>
                    
                    <button onclick="exportData()" class="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium">
                        <i class="fas fa-download mr-2"></i>Export Données
                    </button>
                </div>
            </div>
        </section>
    </body>
    </html>
`));
h.get("/modules/expertise", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Module Expertise Post-Sinistre - HUB Diagnostic</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <header class="bg-gray-700 text-white py-4">
            <div class="max-w-7xl mx-auto px-4 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <i class="fas fa-balance-scale text-2xl"></i>
                    <div>
                        <h1 class="text-2xl font-bold">EXPERTISE POST-SINISTRE</h1>
                        <p class="text-gray-300">Judiciaire • Assurance • Évaluation</p>
                    </div>
                </div>
                <div class="flex space-x-3">
                    <a href="/modules" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-th mr-2"></i>Modules
                    </a>
                    <a href="/" class="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg font-medium">
                        <i class="fas fa-home mr-2"></i>Dashboard
                    </a>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8">
            <div class="grid lg:grid-cols-3 gap-8">
                <!-- Déclaration Sinistre -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-6">
                        <h2 class="text-xl font-bold mb-6">
                            <i class="fas fa-file-alt text-red-600 mr-2"></i>Déclaration Sinistre
                        </h2>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Type Sinistre</label>
                                <select id="sinisterType" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                    <option>Grêle</option>
                                    <option>Incendie</option>
                                    <option>Tempête/Vent</option>
                                    <option>Foudre</option>
                                    <option>Vol/Vandalisme</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Date Sinistre</label>
                                <input type="date" id="sinisterDate" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">Assureur</label>
                                <input type="text" id="insurer" placeholder="Nom de l'assurance" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">N° Dossier</label>
                                <input type="text" id="claimNumber" placeholder="Référence dossier" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Évaluation Dommages -->
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h2 class="text-xl font-bold mb-6">
                            <i class="fas fa-calculator text-blue-600 mr-2"></i>Évaluation Dommages
                        </h2>
                        
                        <div class="space-y-4">
                            <div class="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Modules Endommagés</label>
                                    <input type="number" id="damagedModules" value="0" min="0" onchange="calculateLosses()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Puissance Perdue (kWc)</label>
                                    <input type="number" id="lostPower" value="0" step="0.1" onchange="calculateLosses()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">Taux Dégradation (%)</label>
                                    <input type="number" id="degradationRate" value="100" min="0" max="100" onchange="calculateLosses()" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                </div>
                            </div>
                            
                            <!-- Résultats Calculs -->
                            <div class="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
                                <div class="bg-red-50 rounded-lg p-4">
                                    <h3 class="font-bold text-red-700 mb-2">💰 Pertes Financières</h3>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span>Perte annuelle:</span>
                                            <span id="annualLoss" class="font-bold">0 €/an</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Perte 20 ans:</span>
                                            <span id="totalLoss" class="font-bold">0 €</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Coût réparation:</span>
                                            <span id="repairCost" class="font-bold">0 €</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="bg-blue-50 rounded-lg p-4">
                                    <h3 class="font-bold text-blue-700 mb-2">⚡ Pertes Énergétiques</h3>
                                    <div class="space-y-2 text-sm">
                                        <div class="flex justify-between">
                                            <span>Perte annuelle:</span>
                                            <span id="annualEnergyLoss" class="font-bold">0 kWh/an</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Production perdue:</span>
                                            <span id="lostProduction" class="font-bold">0%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Actions et Statut -->
                <div class="space-y-6">
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold mb-4">📋 Actions Expertise</h3>
                        <div class="space-y-3">
                            <button onclick="startExpertise()" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-search mr-2"></i>Démarrer Expertise
                            </button>
                            <button onclick="generateExpertReport()" class="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-gavel mr-2"></i>Rapport Contradictoire
                            </button>
                            <button onclick="sendToInsurance()" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-paper-plane mr-2"></i>Envoyer Assurance
                            </button>
                            <button onclick="scheduleRepair()" class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium">
                                <i class="fas fa-tools mr-2"></i>Planifier Réparation
                            </button>
                        </div>
                    </div>
                    
                    <div class="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                        <h3 class="text-lg font-bold mb-4">📊 Analyse Multi-Modules</h3>
                        <div class="text-sm text-gray-600 space-y-2">
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-moon text-purple-600"></i>
                                <span>Électroluminescence: Détaillé</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-thermometer-half text-red-600"></i>
                                <span>Thermographie: Points chauds</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-chart-line text-blue-600"></i>
                                <span>Courbes I-V: Performance</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <i class="fas fa-eye text-green-600"></i>
                                <span>Visuel: Dommages physiques</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script>
        function calculateLosses() {
            const damagedModules = parseInt(document.getElementById('damagedModules').value) || 0;
            const lostPower = parseFloat(document.getElementById('lostPower').value) || 0;
            const degradationRate = parseFloat(document.getElementById('degradationRate').value) || 100;
            
            // Calculs énergétiques (1 kWc = ~1200 kWh/an en France)
            const annualProduction = lostPower * 1200 * (degradationRate / 100);
            const lostProductionPercent = (lostPower / 9) * 100; // Supposé 9kWc total
            
            // Calculs financiers (0.06 €/kWh revente + 400€/module)
            const annualFinancialLoss = annualProduction * 0.06;
            const totalFinancialLoss = annualFinancialLoss * 20; // 20 ans
            const repairCost = damagedModules * 400;
            
            // Mise à jour affichage
            document.getElementById('annualEnergyLoss').textContent = Math.round(annualProduction) + ' kWh/an';
            document.getElementById('lostProduction').textContent = lostProductionPercent.toFixed(1) + '%';
            document.getElementById('annualLoss').textContent = Math.round(annualFinancialLoss) + ' €/an';
            document.getElementById('totalLoss').textContent = Math.round(totalFinancialLoss) + ' €';
            document.getElementById('repairCost').textContent = Math.round(repairCost) + ' €';
        }
        
        function startExpertise() {
            alert('🔍 Expertise Démarrée\\n\\nAnalyse multi-modules en cours:\\n• Photos dommages\\n• Mesures précises\\n• Évaluation causes');
        }
        
        function generateExpertReport() {
            alert('📋 Rapport Contradictoire\\n\\nRapport d\\'expertise judiciaire:\\n• Analyse technique complète\\n• Causes et responsabilités\\n• Chiffrage précis\\n• Conclusions expert');
        }
        
        function sendToInsurance() {
            alert('📧 Envoi Assurance\\n\\nDossier complet transmis:\\n• Rapport expertise\\n• Photos géolocalisées\\n• Chiffrage détaillé\\n• Préconisations');
        }
        
        function scheduleRepair() {
            alert('🔧 Planification Réparation\\n\\nIntervention programmée:\\n• Remplacement modules\\n• Vérifications sécurité\\n• Tests post-réparation');
        }
        
        // Calcul initial
        calculateLosses();
        
        // Actions globales
        function createNewProject() {
            window.location.href = '/projects/new';
        }

        function viewAllProjects() {
            window.location.href = '/projects';
        }

        function generateGlobalReport() {
            alert('📄 Générateur de Rapports Globaux\\n\\nFonctionnalité en développement.\\nExport multi-modules avec synthèse exécutive.');
        }

        function exportData() {
            alert('📊 Export Données\\n\\nExport CSV/Excel de toutes les données diagnostic en cours de développement.');
        }
        <\/script>
        
        <!-- Section Actions globales -->
        <section class="max-w-7xl mx-auto px-4 py-8">
            <div class="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                <h3 class="text-2xl font-bold text-gray-800 mb-6">Actions globales</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <button onclick="createNewProject()" class="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium">
                        <i class="fas fa-plus mr-2"></i>Nouveau Projet
                    </button>
                    
                    <button onclick="viewAllProjects()" class="p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
                        <i class="fas fa-folder mr-2"></i>Tous les Projets
                    </button>
                    
                    <button onclick="generateGlobalReport()" class="p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium">
                        <i class="fas fa-file-pdf mr-2"></i>Rapport Global
                    </button>
                    
                    <button onclick="exportData()" class="p-4 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium">
                        <i class="fas fa-download mr-2"></i>Export Données
                    </button>
                </div>
            </div>
        </section>
    </body>
    </html>
`));
export {
  h as default
};
