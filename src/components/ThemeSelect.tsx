import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Theme } from "./ThemeScript.";

export default function ThemeSelect() {
  return (
    <Select
      onValueChange={(e) => {
        const value: Theme = e as Theme;
        global.window?.__setPreferredTheme(value);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="테마설정" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="light">Light</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
          <SelectItem value="wood">Wood</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
