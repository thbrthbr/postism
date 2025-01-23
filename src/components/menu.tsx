import { signOut } from "next-auth/react";
import ThemeSelect from "./ThemeSelect";
import { TbFolderSymlink } from "react-icons/tb";
import { useState } from "react";

interface Props {
  type?: string;
  location: Location;
  customFunctions: any;
}

interface Location {
  x: number;
  y: number;
  id?: string;
  fileType?: string;
  parentId?: string;
}

interface Path {
  name: string;
  route: string;
  depth: number;
  childrenArr: Path[];
}

export default function Menu({ type, location, customFunctions }: Props) {
  const [pathSwitch, setPathSwitch] = useState(false);
  const [path, setPath] = useState<Path>({
    name: "/",
    route: "0",
    depth: 0,
    childrenArr: [],
  });

  const { x, y, id, fileType, parentId } = location;

  // Function to fetch children data and update the path structure
  const getChildren = async (parentRoute: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE}/api/children/${parentRoute}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const temp = await response.json();
      const folders = temp.data;
      // Add children to the appropriate node in the path
      const addChildrenToPath = (currentPath: Path, route: string): Path => {
        if (currentPath.route === route) {
          return {
            ...currentPath,
            childrenArr: folders.map((folder: any) => ({
              name: folder.realTitle,
              route: folder.id,
              depth: currentPath.depth + 1,
              childrenArr: [],
            })),
          };
        }

        return {
          ...currentPath,
          childrenArr: currentPath.childrenArr.map((child) =>
            addChildrenToPath(child, route),
          ),
        };
      };

      setPath((prevPath) => addChildrenToPath(prevPath, parentRoute));
    } catch (error) {
      console.error("Failed to fetch children:", error);
    }
  };

  // Recursive function to render the tree structure
  const renderTree = (node: Path) => {
    return (
      <div key={node.route}>
        <div className="flex justify-between">
          <button
            key={`${node.route}_path`}
            onClick={() => getChildren(node.route)}
            className="block text-start"
          >
            {Array.from({ length: node.depth }).map((_, idx: number) => {
              return <span key={`${node.route}_${idx}`}>&nbsp;&nbsp;</span>;
            })}
            <span>{node.name}</span>
          </button>
          <button
            onClick={() => {
              customFunctions?.editPath(id, fileType, node.route, parentId);
            }}
            className="flex items-center"
            key={`${node.route}_mover`}
          >
            <TbFolderSymlink />
          </button>
        </div>

        {node.childrenArr.length > 0 && (
          <div>{node.childrenArr.map((child) => renderTree(child))}</div>
        )}
      </div>
    );
  };

  return (
    <div
      className="absolute z-[9998] flex w-[200px] flex-col gap-2 rounded-md border-2 border-customBorder p-2"
      style={{
        backgroundColor: "var(--color-bg-primary)",
        left: `${x}px`,
        top: `${y}px`,
      }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      {!type && (
        <>
          <div className="flex">
            <ThemeSelect />
          </div>
          <div>
            <button onClick={customFunctions?.addText}>업로드</button>
          </div>
          <div>
            <button onClick={customFunctions?.addFolder}>폴더 추가</button>
          </div>
          <div>
            <button onClick={() => signOut()}>로그아웃</button>
          </div>
        </>
      )}
      {type === "onFile" && (
        <>
          <div>
            <button onClick={() => setPathSwitch((prev) => !prev)}>이동</button>
          </div>
          {pathSwitch && (
            <div className="w-full border p-2">{renderTree(path)}</div>
          )}
        </>
      )}
    </div>
  );
}
