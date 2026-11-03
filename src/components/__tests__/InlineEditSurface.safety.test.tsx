import { cleanup, fireEvent, render, act } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import InlineEditSurface, { pathOf, type InlineEditController } from "../InlineEditSurface";
import { fingerprintOf } from "@/lib/inlineEditCore";
vi.mock('@/lib/objectScopes', () => ({objectComponentsNow:()=>new Map(),findObjectRoots:()=>[],loadObjectComponents:async()=>new Map()}));
afterEach(cleanup);
it('replays Material placement without making the icon editable or shifting paths, and typing retains adornments', async () => {
  const edits = { 'icon:0.0': 'material:outlined:home', 'icon-position:0.0': 'before' };
  const change = vi.fn();
  const view = render(<InlineEditSurface editing sections={false} edits={edits} onChange={change}><section><h3>Lighting <b>Nova</b></h3></section></InlineEditSurface>);
  await act(async () => {});
  const root = view.container.querySelector('[data-inline-root]'), heading = view.container.querySelector('h3'), bold = view.container.querySelector('b');
  if (!root || !heading || !bold) throw new Error('Missing text');
  expect(view.container.querySelector('[data-inline-icon]')?.getAttribute('contenteditable')).toBe('false');
  expect(view.container.querySelector('[data-inline-icon]')?.hasAttribute('data-inline-editable')).toBe(false);
  expect(pathOf(root, bold)).toBe('0.0.0');
  bold.textContent = 'New'; fireEvent.input(heading);
  expect(change.mock.lastCall?.[1]['icon:0.0']).toBe('material:outlined:home');
  expect(change.mock.lastCall?.[1]['icon-position:0.0']).toBe('before');
});
it('contains section controls in the editor wrapper stacking context', () => {
  const view = render(<InlineEditSurface editing edits={{}} sections={false}><section><h3>Lighting</h3></section></InlineEditSurface>);
  const root = view.container.querySelector('[data-inline-root]');
  expect(root?.parentElement).toHaveClass('relative', 'isolate');
});
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
it('prepares first link fingerprints, preserves them for another kind and removes metadata on last reset', async () => {
  const api = {current:null as InlineEditController|null};
  const children = <section><a href="/original"><span>Explore</span></a></section>;
  const view = render(<InlineEditSurface edits={{}} apiRef={api} sections={false}>{children}</InlineEditSurface>);
  await act(async()=>{});
  const edits = api.current?.prepare('page', {'link:0.0':JSON.stringify({href:'/lighting'})});
  expect(edits?.['fp:0.0']).toBeDefined();
  view.rerender(<InlineEditSurface edits={edits ?? {}} apiRef={api} sections={false}>{children}</InlineEditSurface>);
  expect(api.current?.prepare('page', {})).toEqual({});
  expect(api.current?.prepare('page', {'style:0.0':'{"color":"red"}', 'fp:0.0':edits?.['fp:0.0'] ?? ''})['fp:0.0']).toBe(edits?.['fp:0.0']);
});
it('selects the closest link path from inside a button while nested preview handlers stay disabled', async () => {
  const select = vi.fn(), original = vi.fn();
  render(<InlineEditSurface edits={{}} sections={false}><InlineEditSurface editing sections={false} edits={{'link:0.0':'{"href":"/lighting"}'}} onSelect={select}>
    <section><button onClick={original}><span>Explore</span></button></section>
  </InlineEditSurface></InlineEditSurface>);
  await act(async()=>{});
  const span = document.querySelector('span'); if (!span) throw Error('missing');
  fireEvent.click(span);
  expect(original).not.toHaveBeenCalled();
  expect(select.mock.lastCall?.[0].link.key).toBe('0.0');
  expect(select.mock.lastCall?.[0].link.el.tagName).toBe('BUTTON');
});
