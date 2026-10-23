import { Checkbox } from "@/components/ui/checkbox";
import type { SectionImage } from "@/components/ObjectSections";

export default function PictureLinkControl({ image, onChange }: { image: SectionImage; onChange: (changes: Partial<SectionImage>) => void }) {
  const enabled = !!image.href?.trim();
  return <div className="space-y-1.5">
    <label className="flex items-center gap-2 text-xs">
      <Checkbox checked={!!image.linkCard} disabled={!enabled} onCheckedChange={(on) => onChange({ linkCard: on === true ? true : undefined })} />
      Whole Card Is a Link
    </label>
    {!enabled ? <p className="text-xs text-muted-foreground">Add a link to this picture first.</p> : image.linkCard ? <p className="text-xs text-muted-foreground">The picture, its caption and the text on it all open this link.</p> : null}
  </div>;
}