
"use strict";

/*
============================================
  1. 사용자 정보 설정
============================================
*/

const PROFILE = Object.freeze({
  name: "이석헌",
  job: "Full Stack Developer",
  email: "hello@example.com",
  phone: "010-1234-5678"
});

/*
============================================
  2. 기본 프로필 이미지 설정

  HTML 파일과 같은 폴더에
  cat1.jpg 파일을 넣어주세요.

  JPG, JPEG, PNG, WEBP 지원
============================================
*/

const DEFAULT_IMAGES = [
  "./cat1.jpg",
  "./cat1.jpeg",
  "./cat1.png",
  "./cat1.webp"
];

const STORAGE_KEY = "webcard_custom_avatar_v1";

const $ = (id) => document.getElementById(id);

let toastTimer;
let imageLoadSequence = 0;

/*
============================================
  3. 알림 메시지
============================================
*/

function toast(message) {
  const el = $("toast");

  if (!el) {
    console.info(message);
    return;
  }

  el.textContent = message;
  el.classList.add("visible");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => {
    el.classList.remove("visible");
  }, 2600);
}

/*
============================================
  4. 브라우저에 저장된 이미지 가져오기
============================================
*/

function getCustomImage() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/*
============================================
  5. 프로필 이미지 처리
============================================
*/

function showFallback() {
  $("avatar").hidden = true;
  $("avatarFallback").hidden = false;
}

function showImage(src) {
  $("avatar").src = src;
  $("avatar").hidden = false;
  $("avatarFallback").hidden = true;
}

/*
  cat1.jpg부터 차례대로 확인합니다.

  파일을 찾지 못하면
  다음 확장자로 자동 검색합니다.
*/

function loadAvatar() {
  const seq = ++imageLoadSequence;

  const custom = getCustomImage();

  const candidates = custom
    ? [custom, ...DEFAULT_IMAGES]
    : DEFAULT_IMAGES;

  $("resetImage").hidden = !custom;

  showFallback();

  function tryNext(index) {
    if (seq !== imageLoadSequence) return;

    if (index >= candidates.length) {
      showFallback();

      console.warn(
        "프로필 이미지를 찾지 못했습니다. " +
        "cat1.jpg 파일 위치를 확인하세요."
      );

      return;
    }

    const test = new Image();

    test.onload = () => {
      if (seq === imageLoadSequence) {
        showImage(candidates[index]);
      }
    };

    test.onerror = () => {
      tryNext(index + 1);
    };

    test.src = candidates[index];
  }

  tryNext(0);
}

/*
============================================
  6. 사용자 정보 화면 표시
============================================
*/

function render() {
  $("name").textContent = PROFILE.name;
  $("job").textContent = PROFILE.job;
  $("email").textContent = PROFILE.email;
  $("phone").textContent = PROFILE.phone;

  $("emailLink").href = `mailto:${PROFILE.email}`;

  $("phoneLink").href =
    `tel:${PROFILE.phone.replace(/[^\d+]/g, "")}`;

  $("avatarFallback").textContent =
    Array.from(PROFILE.name.trim())[0] || "?";

  document.title = `${PROFILE.name} | 웹명함`;

  loadAvatar();
}

/*
============================================
  7. 업로드 이미지 최적화
============================================
*/

function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error("파일을 읽을 수 없습니다."));
    };

    reader.onload = () => {
      const image = new Image();

      image.onerror = () => {
        reject(
          new Error("이미지 형식이 올바르지 않습니다.")
        );
      };

      image.onload = () => {
        try {
          const scale = Math.min(
            1,
            640 / Math.max(
              image.naturalWidth,
              image.naturalHeight
            )
          );

          const canvas =
            document.createElement("canvas");

          canvas.width = Math.max(
            1,
            Math.round(image.naturalWidth * scale)
          );

          canvas.height = Math.max(
            1,
            Math.round(image.naturalHeight * scale)
          );

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            throw new Error("캔버스 생성 실패");
          }

          ctx.fillStyle = "#ffffff";

          ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
          );

          ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
          );

          resolve(
            canvas.toDataURL("image/jpeg", 0.8)
          );

        } catch (error) {
          reject(error);
        }
      };

      image.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

/*
============================================
  8. 프로필 이미지 업로드
============================================
*/

$("uploadButton").addEventListener("click", () => {
  $("imageInput").click();
});

$("imageInput").addEventListener(
  "change",
  async (event) => {

    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      toast(
        "JPG, PNG, WEBP 이미지만 업로드할 수 있습니다."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast(
        "10MB 이하의 이미지를 선택해 주세요."
      );
      return;
    }

    try {
      const image = await resizeImage(file);

      try {
        localStorage.setItem(
          STORAGE_KEY,
          image
        );

        loadAvatar();

        toast(
          "프로필 이미지가 이 브라우저에 저장되었습니다."
        );

      } catch {
        ++imageLoadSequence;

        showImage(image);

        toast(
          "사진은 변경됐지만 브라우저에 저장하지 못했습니다."
        );
      }

    } catch {
      toast(
        "이미지를 처리하지 못했습니다."
      );
    }
  }
);

/*
============================================
  9. 기본 이미지로 복원
============================================
*/

$("resetImage").addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    toast(
      "저장된 이미지를 삭제하지 못했습니다."
    );
    return;
  }

  loadAvatar();

  toast(
    "기본 이미지(cat1)로 복원했습니다."
  );
});

/*
============================================
  10. VCard 문자열 처리
============================================
*/

function escapeVCard(text) {
  return String(text)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

/*
============================================
  11. 연락처 저장
============================================
*/

/* 이메일 보내기 */
$("saveContact").addEventListener("click", () => {
  window.location.href = `mailto:${PROFILE.email}`;
});

/*
============================================
  12. 클립보드 복사
============================================
*/

async function copyText(value) {
  // HTTPS 또는 localhost에서는 표준 API 사용
  if (
    navigator.clipboard?.writeText &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // 표준 API가 실패하면 대체 방식 실행
    }
  }

  // 로컬 HTML 환경을 위한 대체 복사 방식
  const temp =
    document.createElement("textarea");

  temp.value = value;
  temp.readOnly = true;
  temp.style.position = "fixed";
  temp.style.left = "-9999px";
  temp.style.top = "0";
  temp.style.opacity = "0";

  document.body.appendChild(temp);

  temp.focus();
  temp.select();

  let ok = false;

  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  } finally {
    temp.remove();
  }

  return ok;
}

/*
============================================
  13. 이메일 클릭 시 클립보드 복사

  - 연락처 이메일: #emailLink
  - 하단 이메일 버튼: .quick-action--email
============================================
*/

async function copyEmail(event) {
  // 기본 이메일 프로그램 실행 방지
  event.preventDefault();

  try {
    const copied = await copyText(PROFILE.email);

    toast(
      copied
        ? `이메일 주소(${PROFILE.email})가 복사되었습니다.`
        : "이메일 주소를 복사하지 못했습니다."
    );

  } catch {
    toast(
      "이메일 주소를 복사하지 못했습니다."
    );
  }
}

function setupQuickActions() {
  const emailTargets = [
    $("emailLink"),
    ...document.querySelectorAll(
      ".quick-action--email"
    )
  ];

  // 동일한 요소에 이벤트 중복 등록 방지
  for (
    const element of new Set(
      emailTargets.filter(Boolean)
    )
  ) {
    element.addEventListener(
      "click",
      copyEmail
    );

    element.setAttribute(
      "aria-label",
      "이메일 주소 복사"
    );
  }

  // 버튼 이름을 실제 동작에 맞게 변경
  document.querySelectorAll(
    ".quick-action--email"
  ).forEach((button) => {
    button.textContent = "이메일 복사";
  });

  // 전화 버튼을 PROFILE 전화번호와 연동
  document.querySelectorAll(
    ".quick-action--phone"
  ).forEach((button) => {
    button.href =
      `tel:${PROFILE.phone.replace(/[^\d+]/g, "")}`;
  });
}

/*
============================================
  14. 명함 공유
============================================
*/

/* ==========================================
   14. 전화 하기
========================================== */

$("shareCard").addEventListener("click", () => {
  const phone = PROFILE.phone.replace(/[^\d+]/g, "");
  window.location.href = `tel:${phone}`;
});

/*
============================================
  15. 초기 실행
============================================
*/

render();
setupQuickActions();
/* ==========================================
   버튼 클릭 시 핑크 네온 효과
========================================== */

document.querySelectorAll(".actions .btn").forEach((button) => {
  let glowTimer;

  button.addEventListener("click", () => {
    // 네온 효과 활성화
    button.classList.add("is-glowing");

    // 연속 클릭 시 기존 타이머 초기화
    clearTimeout(glowTimer);

    // 0.7초 후 네온 효과 제거
    glowTimer = setTimeout(() => {
      button.classList.remove("is-glowing");
    }, 700);
  });
});