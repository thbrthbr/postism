"use client";

interface HelpModalProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-center justify-center px-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(2px)",
      }}
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-[640px] overflow-y-auto rounded-2xl border-2 p-5 shadow-2xl [-ms-overflow-style:none] [scrollbar-width:none] sm:p-6 [&::-webkit-scrollbar]:hidden"
        style={{
          backgroundColor: "var(--color-bg-primary)",
          borderColor: "var(--color-customBorder)",
          color: "var(--color-primary)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-bold sm:text-xl">도움말</h2>
          <button
            className="rounded-md border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--color-customBorder)" }}
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <div className="space-y-5 text-sm leading-6 sm:text-base">
          <section>
            <h3 className="mb-2 font-semibold">기본 사용</h3>
            <div className="space-y-1 opacity-90">
              <p>• 파일을 누르면 해당 파일 열람 가능</p>
              <p>• 폴더를 누르면 해당 폴더로 이동 가능</p>
              <p>• 폴더 내부에서는 뒤로가기 버튼으로 상위 경로로 이동 가능</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">선택 기능</h3>
            <div className="space-y-1 opacity-90">
              <p>• 체크박스로 여러 항목을 동시에 선택 가능</p>
              <p>• 전체 선택 버튼으로 현재 페이지의 항목을 모두 선택 가능</p>
              <p>• 선택 후 이동, 삭제, 다운로드를 한꺼번에 가능</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">드래그 앤 드롭</h3>
            <div className="space-y-1 opacity-90">
              <p>
                • 파일이나 폴더를 다른 폴더로 드래그하면 해당 항목 이동 가능
              </p>
              <p>
                • 여러 개를 선택한 상태에서 그중 하나를 드래그하면 선택된 항목
                전체가 이동 가능
              </p>
              <p>• 파일을 하단 미리보기 영역에 드롭하면 미리보기 가능</p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">다운로드</h3>
            <div className="space-y-1 opacity-90">
              <p>• 파일 하나만 선택하면 압축 없이 바로 다운로드 가능</p>
              <p>
                • 파일 및 폴더 여러개 동시 다운로드 시 zip으로 압축하여 다운로드
                가능
              </p>
            </div>
          </section>

          <section>
            <h3 className="mb-2 font-semibold">편집과 정리</h3>
            <div className="space-y-1 opacity-90">
              <p>• 제목을 눌러 이름을 수정할 수 가능</p>
              <p>• 하트 버튼으로 즐겨찾기 항목 상단에 배치 가능</p>
              <p>• 우클릭 또는 메뉴를 통해 추가 기능을 사용 가능</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
