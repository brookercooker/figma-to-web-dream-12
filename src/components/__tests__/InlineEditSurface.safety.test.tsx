import { cleanup, fireEvent, render, act } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import InlineEditSurface, { type InlineEditController } from "../InlineEditSurface";
import { fingerprintOf } from "@/lib/inlineEditCore";
vi.mock('@/lib/objectScopes', () => ({objectComponentsNow:()=>new Map(),findObjectRoots:()=>[],loadObjectComponents:async()=>new Map()}));
afterEach(cleanup);
it('captures a first typed override from the original and restores it without remounting', async () => {
  const change = vi.fn(), report = vi.fn(); const api = {current:null as InlineEditController|null};
  const children = <section><h3>Ceiling Lighting</h3><img src="/pendant.jpg" /></section>;
  const view = render(<InlineEditSurface edits={{}} editing sections={false} onChange={change} onReport={report} apiRef={api}>{children}</InlineEditSurface>);
  await act(async()=>{});
  const h = view.container.querySelector('h3'); if (!h) throw Error('missing heading');
  const original = fingerprintOf(h); h.innerHTML = 'Staff edit'; fireEvent.input(h);
  const edits = change.mock.calls[0][1];
  expect(JSON.parse(edits['fp:0.0'])).toEqual(original);
  view.rerender(<InlineEditSurface edits={edits} editing sections={false} onChange={change} onReport={report} apiRef={api}>{children}</InlineEditSurface>);
  expect(h.textContent).toBe('Staff edit');
  view.rerender(<InlineEditSurface edits={{}} editing sections={false} onChange={change} onReport={report} apiRef={api}>{children}</InlineEditSurface>);
  expect(h.textContent).toBe('Ceiling Lighting');
});
it('leaves existing unchecked edits unverified until staff explicitly record them', async () => {
  const api = {current:null as InlineEditController|null};
  render(<InlineEditSurface edits={{'0.0':'Saved heading'}} apiRef={api} sections={false}><section><h3>Ceiling Lighting</h3></section></InlineEditSurface>);
  await act(async()=>{});
  expect(api.current?.prepare('page',{'0.0':'Changed again'})).toEqual({'0.0':'Changed again'});
  expect(api.current?.record().page['fp:0.0']).toBeDefined();
});
