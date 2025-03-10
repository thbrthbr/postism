import { signOut, useSession } from "next-auth/react";
import ThemeSelect from "./ThemeSelect";
import { TbFolderSymlink } from "react-icons/tb";
import { useState } from "react";

interface Props {
  type?: string;
  location: Location;
  customFunctions?: any;
}

interface Location {
  x: number;
  y: number;
  id?: string;
  fileType?: string;
  parentId?: string;
}

interface Folder {
  id: string;
  title: string;
  liked: boolean;
  parentId?: string;
  realTitle: string;
  order: number;
  user: string;
}

interface Path {
  name: string;
  route: string;
  depth: number;
  childrenArr: Path[];
}

export default function Menu({ type, location, customFunctions }: Props) {
  const [pathSwitch, setPathSwitch] = useState(false);
  const { data: session } = useSession();
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [path, setPath] = useState<Path>({
    name: "",
    route: "0",
    depth: 0,
    childrenArr: [],
  });

  const { x, y, id, fileType, parentId } = location;

  // 한 번만 모든 폴더 데이터를 가져와 상태에 저장
  const fetchAllFolders = async () => {
    if (!session?.user?.email) return;
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SITE}/api/path?id=${session.user.email}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const result = await response.json();
      setAllFolders(result.data);
    } catch (error) {
      console.error("Failed to fetch all folders:", error);
    }
  };

  // 특정 폴더의 하위 폴더 찾기
  const getChildren = (parentRoute: string): Path[] => {
    return allFolders
      .filter((folder) => folder.parentId === parentRoute)
      .map((folder) => ({
        name: folder.realTitle,
        route: folder.id,
        depth: 0,
        childrenArr: [],
      }));
  };

  // 폴더 클릭 시 하위 폴더 열기/닫기 토글
  const toggleFolder = (node: Path, targetRoute: string): Path => {
    if (node.route === targetRoute) {
      return {
        ...node,
        childrenArr:
          node.childrenArr.length > 0 ? [] : getChildren(targetRoute),
      };
    }
    return {
      ...node,
      childrenArr: node.childrenArr.map((child) =>
        toggleFolder(child, targetRoute),
      ),
    };
  };

  // 폴더 클릭 이벤트 핸들러
  const handleFolderClick = (route: string) => {
    setPath((prevPath) => toggleFolder(prevPath, route));
  };

  // 트리 구조 렌더링 (폴더 클릭하면 하위 폴더 토글)
  const renderTree = (node: Path) => {
    return (
      <div key={node.route}>
        <div className="flex justify-between">
          <button
            onClick={() => handleFolderClick(node.route)}
            className="w-full text-start"
          >
            {Array.from({ length: node.depth }).map((_, idx) => (
              <span key={`${node.route}_${idx}`}>&nbsp;</span>
            ))}
            <span>{node.name}/</span>
          </button>
          <button
            onClick={() => {
              customFunctions?.editPath(id, fileType, node.route, parentId);
            }}
            className="flex items-center"
          >
            <TbFolderSymlink />
          </button>
        </div>
        {node.childrenArr.length > 0 && (
          <div className="ml-2">
            {node.childrenArr.map((child) => renderTree(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="absolute z-[9998] flex w-[200px] flex-col gap-2 rounded-md border-2 border-customBorder p-2"
      style={{
        backgroundColor: "var(--color-bg-primary)",
        left: x < window.innerWidth / 2 ? `${x}px` : `${x - 200}px`,
        top: `${y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
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
            <button
              onClick={() => {
                fetchAllFolders();
                setPathSwitch(true);
              }}
            >
              이동
            </button>
          </div>
          {pathSwitch && path && (
            <div className="w-full border-2 border-customBorder p-2">
              {renderTree(path)}
            </div>
          )}
        </>
      )}
      {type === "inFile" && (
        <>
          <div className="flex">
            <ThemeSelect />
          </div>
        </>
      )}
    </div>
  );
}
