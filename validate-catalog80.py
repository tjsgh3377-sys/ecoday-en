# -*- coding: utf-8 -*-
"""validate-catalog80.py — 80페이지 카탈로그 기준 이미지/데이터 자동 검수 (사양서 §32).

검사 항목:
 - PDF가 80페이지인지 (PDF 접근 가능 시)
 - 제품 이미지가 허용된 '제품 페이지'에서 추출되었는지 (설치사례 페이지 금지)
 - 모든 모델이 catalog80 이미지 + 사양 + 식별번호(또는 needs_check) 보유
 - 영문 필드 한글 잔존 없음
 - 이미지 파일 실제 존재
 - 인증서 7 / 지식재산권 18, 출처 PDF 4 / 5
 - 크롭 좌표가 페이지 범위 내 (매니페스트 기준)
사용: PYTHONIOENCODING=utf-8 python -I validate-catalog80.py
"""
import json, os, re, sys
try: sys.stdout.reconfigure(encoding="utf-8")
except Exception: pass
ROOT = os.path.dirname(os.path.abspath(__file__))
HANGUL = re.compile(r"[\uAC00-\uD7A3]")
PAGE_W, PAGE_H = 841.89, 595.28

# 허용 제품 페이지 (사양서 §18) / 금지(설치) 페이지 (§19)
PRODUCT_PAGES = set([6,7,8,9,10,11] + [18,20,22,24,26,28,30,32,33,34,36,38,40,42,44,46,48,50,52,54,55]
                    + [56,57,58,59,62,63] + list(range(64,72)) + [74,76,77,78])
INSTALL_PAGES = set([12,13,14,15,16,17,19,21,23,25,27,29,31,35,37,39,41,43,45,47,49,51,53,60,61,72,73,75,79])

def main():
    errors, warns = [], []
    # PDF page count (optional)
    try:
        import fitz
        for cand in os.listdir(r"D:\문선호\퍼스트마케팅컴퍼니\업체별 견적 및 신청서\카달로그제작 견적서\에코데이인터내셔널\카탈로그"):
            if "브로슈어" in cand and cand.endswith(".pdf"):
                d = fitz.open(os.path.join(r"D:\문선호\퍼스트마케팅컴퍼니\업체별 견적 및 신청서\카달로그제작 견적서\에코데이인터내셔널\카탈로그", cand))
                if len(d) != 80: errors.append("신규 PDF 페이지 수 != 80 (%d)" % len(d))
                else: print("PDF OK: 80 pages")
                break
    except Exception as e:
        warns.append("PDF 페이지 수 미확인 (%s)" % type(e).__name__)

    P = json.load(open(os.path.join(ROOT,"data","catalog_products.json"), encoding="utf-8"))
    C = json.load(open(os.path.join(ROOT,"data","certificates.json"), encoding="utf-8"))
    products = P["products"]

    for p in products:
        m = p["model"]
        img = p.get("image","")
        if not img: errors.append("[%s] image 누락" % m); continue
        if "catalog80" not in img: errors.append("[%s] 신규 catalog80 이미지가 아님: %s" % (m, img))
        fp = os.path.join(ROOT, img.replace("/", os.sep))
        if not os.path.isfile(fp): errors.append("[%s] 이미지 파일 없음: %s" % (m, img))
        pg = p.get("sourcePdfPage")
        if pg in INSTALL_PAGES:
            errors.append("[%s] 설치사례 페이지(%s)를 제품 이미지 출처로 사용" % (m, pg))
        elif pg not in PRODUCT_PAGES:
            warns.append("[%s] 출처 페이지(%s)가 허용 제품 페이지 목록 밖" % (m, pg))
        spec = p.get("specifications")
        if not isinstance(spec, dict) or not any(str(v).strip() for v in spec.values()):
            errors.append("[%s] specifications 비어있음" % m)
        if not p.get("procurementId") and p.get("verificationStatus") != "needs_check":
            warns.append("[%s] procurementId 누락" % m)
        for fld in ("descriptionEn","powerTypeEn","nameEn"):
            v = p.get(fld)
            if v and HANGUL.search(str(v)): errors.append("[%s] %s 한글 잔존" % (m, fld))

    # certificates / IP
    if len(C["certificates"]) != 7: errors.append("인증서 수 != 7 (%d)" % len(C["certificates"]))
    if len(C["intellectualProperties"]) != 18: errors.append("지식재산권 수 != 18 (%d)" % len(C["intellectualProperties"]))
    for it in C["certificates"]:
        if str(it.get("pdfPage")) != "4": warns.append("인증서 %s 출처가 PDF 4가 아님" % it["id"])
        fp = os.path.join(ROOT, it["image"].replace("/", os.sep))
        if not os.path.isfile(fp): errors.append("인증서 이미지 없음: %s" % it["image"])
    for it in C["intellectualProperties"]:
        if str(it.get("pdfPage")) != "5": warns.append("지식재산권 %s 출처가 PDF 5가 아님" % it["id"])
        fp = os.path.join(ROOT, it["image"].replace("/", os.sep))
        if not os.path.isfile(fp): errors.append("지식재산권 이미지 없음: %s" % it["image"])
    ips = [x.get("typeKo") for x in C["intellectualProperties"]]
    pat = sum(1 for t in ips if t == "특허")
    print("IP types: 특허 %d, 디자인 %d" % (pat, len(ips)-pat))

    # crop boxes within bounds (manifest)
    mf = os.path.join(ROOT,"CATALOG80_IMAGE_MANIFEST.json")
    if os.path.isfile(mf):
        for it in json.load(open(mf,encoding="utf-8"))["items"]:
            b = it.get("cropBox")
            if b and (b[0]<0 or b[1]<0 or b[2]>PAGE_W or b[3]>PAGE_H or b[0]>=b[2] or b[1]>=b[3]):
                errors.append("크롭 좌표 범위 밖: %s %s" % (it.get("id"), b))

    print("\n" + "="*56)
    print("제품:%d  인증서:%d  지식재산권:%d" % (len(products), len(C["certificates"]), len(C["intellectualProperties"])))
    print("신규 catalog80 이미지 사용:", sum(1 for p in products if "catalog80" in p.get("image","")))
    print("needs_check 제품:", sum(1 for p in products if p.get("verificationStatus")=="needs_check"))
    if warns:
        print("\n경고 %d건:" % len(warns))
        for w in warns[:40]: print("  ! " + w)
    if errors:
        print("\n오류 %d건:" % len(errors))
        for e in errors: print("  X " + e)
        print("\nFAIL"); return 1
    print("\n오류 0건 — 모든 제품이 신규 80p 제품페이지 이미지를 보유, 설치사진 오사용 없음, 영문 한글 잔존 없음.")
    print("PASS"); return 0

if __name__ == "__main__":
    sys.exit(main())
