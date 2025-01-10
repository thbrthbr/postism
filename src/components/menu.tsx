import { signOut } from "next-auth/react";
import ThemeSelect from "./ThemeSelect";

interface Props {
  location: Location;
  customFunctions: any;
}

interface Location {
  x: number;
  y: number;
}

export default function Menu({ location, customFunctions }: Props) {
  const { x, y } = location;

  return (
    <div
      className="absolute z-[9998] flex w-[200px] flex-col gap-2 rounded-md border-2 border-border p-2"
      style={{
        backgroundColor: "var(--color-bg-primary)",
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className="flex">
        <ThemeSelect />
      </div>
      <div>
        <button onClick={customFunctions?.addText}>업로드</button>
      </div>
      <div>
        <button onClick={() => alert("기능추가예정")}>폴더 추가</button>
      </div>
      <div>
        <button onClick={() => signOut()}>로그아웃</button>
      </div>
    </div>
  );
}
