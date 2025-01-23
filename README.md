# **POSTISM**

![Image](https://github.com/user-attachments/assets/8eefc277-d35e-466c-8e60-e564f2797285)

**POSTISM**은 자신만의 메모 공간을 제공하는 서비스입니다

<br/>

### 프로젝트 소개

_이런 분들에게 좋아요!_

- PC와 모바일에서의 동기화된 메모공간이 필요하신 분들
- 기존 텍스트 파일에 덧붙여 작성할 때 굳이 어디 클라우드나 저장소에 들어가 다운 받은 후 작성하고 새로 업로드하기 귀찮으신 분들
- 링크만으로 텍스트 파일을 곧바로 열람 및 공유하고 싶으신 분들
- 어디서든 지속적으로 글을 쓰는 게 목적이신 분들

  <br>

## 🖇️ 배포 링크

https://postism.vercel.app/

<br>

## 📅 프로젝트 기간

2024년 11월 25일 ~ 현재 진행 중
(주요 기능 개발 완료 후 지속적으로 개선 및 유지 보수 중)

<br>

## **🚀 설치 및 실행 방법**

### 기본 실행

```bash
git clone https://github.com/thbrthbr/postism.git
```

프로젝트를 받습니다

```bash
npm install
npm run dev
```

해당 프로젝트를 받은 경로에서 실행합니다

<br>

## **🛠️ Skills**

<table>
<tr>
<td align="center"><b>패키지 관리</b></td>
<td>

![Npm](https://img.shields.io/badge/Npm-CB3837?style=for-the-badge&logo=npm&logoColor=white)

</td>
</tr>
<tr>
<td align="center"><b>Development</b></td>
<td>

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn.ui-000000?style=for-the-badge&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-DD2C00?style=for-the-badge&logo=Firebase&logoColor=white)
![OAuth](https://img.shields.io/badge/Oauth-EB5424?style=for-the-badge&logo=Oauth&logoColor=white)

</td>
</tr>

<tr>
<td align="center"><b>배포</b></td>
<td>

![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

</td>
</tr>

</table>

<br>

## **💻 화면 구성**

### 1. 로그인 및 회원가입

<table>
<tr>

</tr>
</table>

![Image](https://github.com/user-attachments/assets/a5eff8c5-99dc-4802-abaf-49fada33c8c6)

- OAuth로 구글계정을 통해 소셜로그인을 통해 간편히 입장

  <br>

### 2. 개인 페이지

![Image](https://github.com/user-attachments/assets/574b3eda-e4b5-4bc3-bfc4-408d3471e386)

![Image](https://github.com/user-attachments/assets/8c293cae-ccac-4baa-ad69-a6c58bfa0bdd)

![Image](https://github.com/user-attachments/assets/3e24261f-f5ea-4514-810c-36663c78b296)

![Image](https://github.com/user-attachments/assets/449a507d-9e1f-4e49-a24b-059413c48d14)

![Image](https://github.com/user-attachments/assets/f44589c2-adca-460c-822d-e05bf39a36f9)

- 텍스트파일 추가 / 파일명 수정 / 즐겨찾기시 상단 배치
- 텍스트 파일 삭제시 알림 후 진행
- 테마 설정
- 텍스트파일 업로드
- 텍스트파일 드롭다운 업로드
- 폴더 추가 (기능 추가 예정)

  <br>

### 3. 텍스트 페이지

![Image](https://github.com/user-attachments/assets/cf6fd284-16fe-4e1a-b165-e458486fe627)

- 텍스트파일 다운로드
- 텍스트파일 저장
- 맨 아래로 버튼

  <br>

### 4. 공유/열람 및 뷰어모드

![Image](https://github.com/user-attachments/assets/f7cb3c3e-34fa-4246-9d98-bb9abb445768)

- 해당 텍스트의 고유주소 링크로 공유 가능
- 해당 텍스트의 작성자가 아니면 수정 불가능 (뷰어모드)
- 허용된 유저일 시 편집 권한 부여 (추가 예정)

  <br>

## **📂 폴더 구조**

```plaintext
src/
├── app/                   # Next.js App Router 디렉토리
│   ├── api/               # API 요청 함수들
│   │   ├── auth/          # 소셜로그인 관련 API 요청
│   │   ├── like/          # 즐겨찾기 관련 API 요청
│   │   └── text/          # text파일 관련 API 요청
│   ├── text/              # 개별 텍스트 페이지
│   │   └── page.tsx
│   ├── page.tsx           # 개인 페이지 / 로그인 페이지
│   └── layout.tsx         # 레이아웃
├── asset/                 # 정적 자산 파일
├── components/            # 컴포넌트
├── firebase/              # 파이어베이스 api
├── hooks/                 # 재사용 가능한 커스텀 훅
└── lib/                   # 유틸리티 함수

```
