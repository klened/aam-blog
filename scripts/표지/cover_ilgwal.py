# -*- coding: utf-8 -*-
"""일괄적용과 개별적용 대표이미지."""
import io, os

여기 = os.path.dirname(os.path.abspath(__file__))
exec(compile(io.open(os.path.join(여기, 'cover_chebul2_base.py'), encoding='utf-8').read(),
             'base', 'exec'))

im, d = base("회사가 하나, 현장은 그 아래입니다", "보험료징수법 제8조")
y = table(d, ["이 세 가지가 맞으면", "무슨 뜻인가"],
          [["사업주가 같다", "같은 회사가 하는 공사"],
           ["기간이 정해져 있다", "시작과 끝이 있는 사업"],
           ["건설업자 등이 한다", "건설업자 · 주택건설사업자 등"]],
          강조=-1, 폭=[0.38, 0.62], top=132)
d.text((60 * S, (y + 42) * S), "신청하지 않아도 당연일괄적용입니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
d.text((60 * S, (y + 78) * S), "법이 그 사업 전부를 하나로 봅니다. 보험료도 회사 전체로 한 번 냅니다.",
       font=f(RG, 16), fill=TXT_DARK, anchor="lm")
d.text((60 * S, (y + 118) * S), "하도급은 원수급인이 사업주이고, 승인받은 부분만 갈라집니다",
       font=f(BD, 20), fill=TXT_GOLD, anchor="lm")
footer(d, "하수급인 승인은 착공일부터 30일 이내입니다",
       "넘기면 승인을 못 받고, 그 인원은 원수급인 몫으로 남아 나중에 부과됩니다.")
save(im, "일괄적용-개별적용")

print("\n끝")
