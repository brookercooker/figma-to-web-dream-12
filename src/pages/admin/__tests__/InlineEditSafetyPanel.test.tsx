import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import InlineEditSafetyPanel from "../InlineEditSafetyPanel";
afterEach(cleanup);
it("discards only the selected orphan and keeps the other action inert", () => {
  const discard = vi.fn();
  render(<InlineEditSafetyPanel reports={{page:{applied:[],unchecked:[],rejected:[],orphaned:[{path:'0.1',kinds:['html'],reason:'The text under it changed.'}]}}} selection={null} editsFor={() => ({'0.1':'Light transforms rooms'})} discard={discard} record={vi.fn()} resetAll={vi.fn()} />);
  fireEvent.click(screen.getByRole('button',{name:/Edits That Could Not Be Applied/}));
  fireEvent.click(screen.getByRole('button',{name:'Keep For Now'})); expect(discard).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Discard This Edit'})); expect(discard).toHaveBeenCalledWith('page','0.1');
});
it("records unchecked fingerprints and requires confirmation for reset all", () => {
  const record = vi.fn(), resetAll = vi.fn(), discard = vi.fn();
  const el = document.createElement('h3');
  render(<InlineEditSafetyPanel reports={{page:{applied:[],unchecked:['0.1'],rejected:[],orphaned:[]}}} selection={{scope:'page',key:'0.1',kind:'text',el}} editsFor={() => ({})} discard={discard} record={record} resetAll={resetAll} />);
  fireEvent.click(screen.getByRole('button',{name:'Record Fingerprints'})); expect(record).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button',{name:'Reset Element'})); expect(discard).toHaveBeenCalledWith('page','0.1');
  fireEvent.click(screen.getByRole('button',{name:'Reset All Edits on This Page'})); expect(resetAll).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:/^Reset All Edits$/})); expect(resetAll).toHaveBeenCalledOnce();
});
it("labels orphaned link edits and resets all keys at their selected path", () => {
  const discard = vi.fn(), el = document.createElement('a');
  render(<InlineEditSafetyPanel reports={{page:{applied:[],unchecked:[],rejected:[],orphaned:[{path:'0',kinds:['link'],reason:'The code changed.'}]}}} selection={{scope:'page',key:'0',kind:'text',el}} editsFor={() => ({'link:0':'{"href":"/lighting"}','fp:0':'{}'})} discard={discard} record={vi.fn()} resetAll={vi.fn()} />);
  fireEvent.click(screen.getByRole('button',{name:/Edits That Could Not Be Applied/}));
  expect(screen.getByText('Link')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button',{name:'Reset Element'})); expect(discard).toHaveBeenCalledWith('page','0');
});
