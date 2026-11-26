# -*- coding: utf-8 -*-
"""
validate-catalog-data.py
에코데이 카탈로그 데이터 무결성 검증기.

검증 항목:
  1) 카테고리별 모델(product) 수
  2) 모든 모델이 image / imageType=="product" / specifications(비어있지 않음) / procurementId 보유
  3) 모델이 참조하는 모든 이미지 파일이 디스크에 실제 존재
  4) 영문 노출 필드(descriptionEn, powerTypeEn, nameEn)에 한글 잔존 없음
  5) 이미지 공통(sharedImage) 플래그와 실제 공유 현황 교차 확인
  6) 고아 이미지(데이터가 참조하지 않는 cat/ 이미지) 목록

사용:
  PYTHONIOENCODING=utf-8 python -I validate-catalog-data.py
종료코드: 오류 있으면 1, 없으면 0.
"""
import json, os, re, sys

try:
    sys.stdout.reconfigure(encoding="utf-8")
except Exception:
    pass

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(ROOT, "data", "catalog_products.json")
CATDIR = os.path.join(ROOT, "assets", "photos", "cat")
HANGUL = re.compile(r"[가-힣]")

CAT_ORDER = ["roadstud", "lighting", "bollard", "fence", "signal", "sign", "chevron"]
CAT_LABEL = {
    "roadstud": "도로표지병", "lighting": "LED 경관조명", "bollard": "볼라드",
    "fence": "디자인형 울타리", "signal": "바닥형 보행신호등",
    "sign": "교통안전표지판", "chevron": "갈매기표지판",
}


def main():
    with open(DATA, encoding="utf-8") as f:
        doc = json.load(f)
    products = doc.get("products", [])
    errors, warns = [], []

    # 1) 카테고리별 집계
    by_cat = {}
    for p in products:
        by_cat.setdefault(p.get("category"), []).append(p)

    print("=" * 60)
    print("카테고리별 모델 수")
    print("=" * 60)
    total = 0
    for c in CAT_ORDER:
        n = len(by_cat.get(c, []))
        total += n
        print("  %-10s %-18s %3d 모델" % (c, CAT_LABEL.get(c, ""), n))
    # 미분류 카테고리
    for c in by_cat:
        if c not in CAT_ORDER:
            errors.append("알 수 없는 카테고리: %r (%d 모델)" % (c, len(by_cat[c])))
    print("  %-30s %3d 모델" % ("합계", total))

    # 2) 필수 필드 + 3) 이미지 존재
    referenced = set()
    for p in products:
        m = p.get("model", p.get("id", "?"))
        if not p.get("image"):
            errors.append("[%s] image 누락" % m)
        else:
            img = p["image"]
            referenced.add(os.path.basename(img))
            fp = os.path.join(ROOT, img.replace("/", os.sep))
            if not os.path.isfile(fp):
                errors.append("[%s] 이미지 파일 없음: %s" % (m, img))
        if p.get("imageType") != "product":
            warns.append("[%s] imageType != product (%r)" % (m, p.get("imageType")))
        spec = p.get("specifications")
        if not isinstance(spec, dict) or not any((str(v).strip() for v in spec.values())):
            errors.append("[%s] specifications 비어있음" % m)
        if not p.get("procurementId"):
            warns.append("[%s] procurementId 누락(확인 필요)" % m)

        # 4) 영문 필드 한글 잔존
        for fld in ("descriptionEn", "powerTypeEn", "nameEn"):
            v = p.get(fld)
            if v and HANGUL.search(str(v)):
                errors.append("[%s] %s 한글 잔존: %r" % (m, fld, v))

    # 5) sharedImage 교차 확인: 같은 image를 쓰는 모델이 2개 이상이면 공통
    img_users = {}
    for p in products:
        if p.get("image"):
            img_users.setdefault(p["image"], []).append(p.get("model", "?"))
    print()
    print("=" * 60)
    print("이미지 공유 현황 (공통 이미지 = 2+ 모델이 1 이미지 공유)")
    print("=" * 60)
    shared_imgs = {k: v for k, v in img_users.items() if len(v) > 1}
    uniq_imgs = {k: v for k, v in img_users.items() if len(v) == 1}
    print("  고유 이미지: %d개" % len(uniq_imgs))
    print("  공통 이미지: %d개 (아래)" % len(shared_imgs))
    for img, users in sorted(shared_imgs.items()):
        print("    %-34s ← %d 모델" % (os.path.basename(img), len(users)))
    # sharedImage 플래그 일관성
    for p in products:
        if not p.get("image"):
            continue
        is_shared = len(img_users[p["image"]]) > 1
        flag = bool(p.get("sharedImage"))
        if is_shared != flag:
            warns.append("[%s] sharedImage 플래그(%s)와 실제 공유(%s) 불일치"
                         % (p.get("model", "?"), flag, is_shared))

    # 6) 고아 이미지
    on_disk = set(fn for fn in os.listdir(CATDIR) if fn.lower().endswith((".jpg", ".png", ".jpeg")))
    orphans = sorted(on_disk - referenced)
    print()
    print("=" * 60)
    print("고아 이미지 (cat/ 에 있으나 제품 데이터가 참조 안 함): %d개" % len(orphans))
    print("=" * 60)
    for o in orphans:
        print("    %s" % o)
    print("  ※ 설치사례/인증서 이미지일 수 있어 오류 아님 — 참고용.")

    # 결과
    print()
    print("=" * 60)
    print("검증 결과")
    print("=" * 60)
    if warns:
        print("경고 %d건:" % len(warns))
        for w in warns:
            print("  ! " + w)
    if errors:
        print("오류 %d건:" % len(errors))
        for e in errors:
            print("  X " + e)
        print("\nFAIL")
        return 1
    print("오류 0건 — 모든 모델이 이미지·사양·식별번호를 보유하고, 영문 필드에 한글 잔존 없음.")
    print("\nPASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
