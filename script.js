
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

$("saveContact").addEventListener(
  "click",
  () => {

    const phone =
      PROFILE.phone.replace(/[^\d+]/g, "");

    const card = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${escapeVCard(PROFILE.name)}`,
      `N:;${escapeVCard(PROFILE.name)};;;`,
      `TITLE:${escapeVCard(PROFILE.job)}`,
      `EMAIL;TYPE=INTERNET:${escapeVCard(PROFILE.email)}`,
      `TEL;TYPE=CELL:${phone}`,
      "END:VCARD"
    ].join("\r\n") + "\r\n";

    const blob = new Blob(
      ["\ufeff", card],
      {
        type: "text/vcard;charset=utf-8"
      }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download =
      `${PROFILE.name.replace(/[\\/:*?"<>|]/g, "_") || "contact"}.vcf`;

    document.body.appendChild(a);

    a.click();
    a.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 2000);

    toast(
      "연락처 파일을 저장했습니다."
    );
  }
);

/*
============================================
  12. 클립보드 복사
============================================
*/

async function copyText(value) {
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(value);

    return true;
  }

  const temp =
    document.createElement("textarea");

  temp.value = value;
  temp.style.position = "fixed";
  temp.style.opacity = "0";

  document.body.appendChild(temp);

  temp.select();

  let ok = false;

  try {
    ok = document.execCommand("copy");
  } finally {
    temp.remove();
  }

  return ok;
}

/*
============================================
  13. 명함 공유
============================================
*/

$("shareCard").addEventListener(
  "click",
  async () => {

    const info = [
      `${PROFILE.name} | ${PROFILE.job}`,
      `이메일: ${PROFILE.email}`,
      `전화번호: ${PROFILE.phone}`
    ].join("\n");

    const hosted =
      /^https?:$/.test(location.protocol);

    const shareData = {
      title: `${PROFILE.name} 웹명함`,
      text: info
    };

    if (hosted) {
      shareData.url = location.href;
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData);

      } else {
        const content = hosted
          ? `${info}\n${location.href}`
          : info;

        const copied =
          await copyText(content);

        toast(
          copied
            ? "명함 정보를 복사했습니다."
            : "클립보드 복사를 지원하지 않습니다."
        );
      }

    } catch (error) {

      if (error?.name !== "AbortError") {

        const content = hosted
          ? `${info}\n${location.href}`
          : info;

        try {
          const copied =
            await copyText(content);

          toast(
            copied
              ? "명함 정보를 복사했습니다."
              : "명함 공유에 실패했습니다."
          );

        } catch {
          toast(
            "명함 공유에 실패했습니다."
          );
        }
      }
    }
  }
);

/*
============================================
  14. 초기 실행
============================================
*/

render();
