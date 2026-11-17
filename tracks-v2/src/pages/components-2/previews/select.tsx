import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/motion/select";
import { MorphSelect, MorphSelectContent, MorphSelectItem, MorphSelectTrigger, MorphSelectValue } from "@/components/motion/select-morph";
export function SelectPreview() {
  const [value, setValue] = useState("next");
  return (
    <div className="w-56">
      <Select value={value} onValueChange={setValue}>
        <SelectTrigger>
          <SelectValue placeholder="Pick a framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="next">Next.js</SelectItem>
          <SelectItem value="remix">Remix</SelectItem>
          <SelectItem value="astro">Astro</SelectItem>
          <SelectItem value="vite">Vite</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

export function SelectMorphPreview() {
  const [value, setValue] = useState("next");
  return (
    <div className="w-56">
      <MorphSelect value={value} onValueChange={setValue}>
        <MorphSelectTrigger>
          <MorphSelectValue placeholder="Pick a framework" />
        </MorphSelectTrigger>
        <MorphSelectContent>
          <MorphSelectItem value="next">Next.js</MorphSelectItem>
          <MorphSelectItem value="remix">Remix</MorphSelectItem>
          <MorphSelectItem value="astro">Astro</MorphSelectItem>
          <MorphSelectItem value="vite">Vite</MorphSelectItem>
        </MorphSelectContent>
      </MorphSelect>
    </div>
  );
}

