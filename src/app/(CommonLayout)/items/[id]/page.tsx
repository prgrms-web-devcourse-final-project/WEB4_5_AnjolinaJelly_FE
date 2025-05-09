"use client";
import React from "react";
import { notFound } from "next/navigation";
import {
  Box,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ImageWithFallback from "@/components/ImageWithFallback";
import timedealsData from "@/api/zzirit/mocks/timedeals.json";
import itemsData from "@/api/zzirit/mocks/items.json";
import {
  ItemResponse,
  ItemResponseTimeDealStatusEnum,
} from "@/api/zzirit/models/ItemResponse";

// 가격 3자리 콤마
function formatPrice(price?: number) {
  if (typeof price !== "number") return "-";
  return price.toLocaleString();
}

// 남은 시간 계산
function getTimeLeft(end: Date) {
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  if (diff <= 0) return "종료됨";
  const h = Math.floor(diff / 1000 / 60 / 60);
  const m = Math.floor((diff / 1000 / 60) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return `${h}시간 ${m}분 ${s}초 남음`;
}

// 타임딜 정보 찾기
interface TimeDealItemInfo {
  discountRate: number;
  originalPrice: number;
  finalPrice: number;
  quantity: number;
  endTime: string;
}
function findTimeDealInfo(itemId: number): TimeDealItemInfo | null {
  const deals: Array<{
    discountRate: number;
    endTime: string;
    items: Array<{
      itemId: number;
      originalPrice: number;
      finalPrice: number;
      quantity: number;
    }>;
  }> = timedealsData.result.content;
  for (const deal of deals) {
    const found = deal.items.find((i) => i.itemId === itemId);
    if (found) {
      return {
        discountRate: deal.discountRate,
        originalPrice: found.originalPrice,
        finalPrice: found.finalPrice,
        quantity: found.quantity,
        endTime: deal.endTime,
      };
    }
  }
  return null;
}

// items.json -> ItemResponse로 변환 (endTimeDeal 변환 포함)
function toItemResponse(raw: unknown): ItemResponse {
  if (typeof raw === "object" && raw !== null) {
    const {
      itemId,
      name,
      type,
      brand,
      quantity,
      price,
      timeDealStatus,
      endTimeDeal,
    } = raw as {
      itemId?: number;
      name?: string;
      type?: string;
      brand?: string;
      quantity?: number;
      price?: number;
      timeDealStatus?: string;
      endTimeDeal?: string | null;
    };
    let status: ItemResponse["timeDealStatus"] = undefined;
    if (timeDealStatus === "NONE") status = ItemResponseTimeDealStatusEnum.None;
    else if (timeDealStatus === "TIME_DEAL")
      status = ItemResponseTimeDealStatusEnum.TimeDeal;
    return {
      itemId,
      name,
      type,
      brand,
      quantity,
      price,
      timeDealStatus: status,
      endTimeDeal: endTimeDeal ? new Date(endTimeDeal) : undefined,
    };
  }
  return {};
}

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // React Hook은 조건문 이전에 선언해야 함
  const [modalOpen, setModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Next.js 15: params는 Promise이므로 React.use()로 언래핑
  const { id } = React.use(params);
  const itemId = Number(id);
  if (!itemId) return notFound();
  const item = (itemsData.result.content as unknown[])
    .map(toItemResponse)
    .find((i) => i.itemId === itemId);
  if (!item) return notFound();

  // 타임딜 정보
  const timeDealInfo = findTimeDealInfo(item.itemId!);
  const isTimeDeal = !!timeDealInfo;

  // 장바구니 담기 핸들러
  const handleAddToCart = async () => {
    setLoading(true);
    setError(null);
    try {
      // 장바구니에 담는 로직 (API 호출)
      // 실제 서비스에서는 아래 주석을 해제하여 사용하세요.
      // const req: CartItemAddRequest = {
      //   itemId: item.itemId!,
      //   quantity: 1,
      //   timeDeal: isTimeDeal,
      // };
      // await client.addItemToCart({ cartItemAddRequest: req });
      setModalOpen(true); // API 호출 없이 모달만 띄움
    } catch (e: unknown) {
      let message = "장바구니 담기에 실패했습니다. 다시 시도해주세요.";
      if (e instanceof Error && e.message) message = e.message;
      setError(message);
      setModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // 모달 닫기
  const handleCloseModal = () => {
    setModalOpen(false);
    setError(null);
  };

  // 장바구니 페이지로 이동
  const handleGoToCart = () => {
    window.location.href = "/cart";
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", my: 6, p: { xs: 1, sm: 3 } }}>
      {/* 장바구니 추가 완료 모달 */}
      <Dialog open={modalOpen} onClose={handleCloseModal}>
        <DialogTitle>{error ? "오류" : "장바구니 추가 완료"}</DialogTitle>
        <DialogContent>
          <Typography>
            {error ? error : "상품이 장바구니에 추가되었습니다. 이동할까요?"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="inherit">
            {error ? "닫기" : "계속 쇼핑하기"}
          </Button>
          {!error && (
            <Button
              onClick={handleGoToCart}
              color="primary"
              variant="contained"
            >
              장바구니로 이동
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={4}
        sx={{ p: { xs: 2, sm: 4 }, background: "none", boxShadow: "none" }}
      >
        {/* 좌측: 상품 이미지 */}
        <Box sx={{ minWidth: 320, maxWidth: 400, flex: 1 }}>
          <ImageWithFallback
            src={"/images/placeholder.png"}
            alt={item.name || "상품 이미지"}
            width={400}
            height={400}
            style={{
              borderRadius: 12,
              objectFit: "cover",
              width: "100%",
              height: 400,
              background: "#f5f5f5",
            }}
            fallbackKey={String(item.itemId)}
          />
        </Box>

        {/* 우측: 상품 정보 */}
        <Box sx={{ flex: 2, display: "flex", flexDirection: "column", gap: 1 }}>
          {/* 타임딜 라벨 및 남은 시간 */}
          {isTimeDeal && timeDealInfo && (
            <Stack direction="row" alignItems="center" spacing={2} mb={1}>
              <Chip
                label="타임딜 상품"
                color="error"
                size="small"
                sx={{ fontWeight: 700 }}
              />
              <Typography color="error" fontWeight={700}>
                {timeDealInfo.endTime
                  ? getTimeLeft(new Date(timeDealInfo.endTime))
                  : "-"}
              </Typography>
            </Stack>
          )}

          {/* 상품명 + 카테고리(종류) */}
          <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
            <Typography variant="h4" fontWeight={800}>
              {item.name}
            </Typography>
            {item.type && (
              <Chip
                label={item.type}
                size="small"
                sx={{
                  ml: 1,
                  fontWeight: 500,
                  fontSize: 14,
                  background: "#f5f5f5",
                }}
              />
            )}
          </Stack>

          {/* 가격/할인 */}
          <Box>
            {isTimeDeal && timeDealInfo ? (
              <Stack direction="column">
                <Stack direction="row" alignItems="baseline" spacing={1.5}>
                  <Stack direction="row" alignItems="baseline" spacing={0.5}>
                    <Typography variant="h5" color="error" fontWeight={700}>
                      {formatPrice(timeDealInfo.finalPrice)}원
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textDecoration: "line-through" }}
                    >
                      {formatPrice(timeDealInfo.originalPrice)}원
                    </Typography>
                  </Stack>

                  <Chip
                    label={`-${timeDealInfo.discountRate}%`}
                    color="warning"
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: 10,
                    }}
                  />
                </Stack>
                {/* 남은 수량 (타임딜 한정) */}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  mb={2}
                >
                  남은 수량: {timeDealInfo.quantity}개
                </Typography>
              </Stack>
            ) : (
              <Typography variant="h5" fontWeight={700}>
                {formatPrice(item.price)}원
              </Typography>
            )}
          </Box>

          {/* 장바구니/구매 버튼 */}
          <Stack direction="row" spacing={2} mb={3}>
            <Button
              variant="outlined"
              color="secondary"
              size="large"
              sx={{ minWidth: 140, fontWeight: 700 }}
              onClick={handleAddToCart}
              disabled={loading}
            >
              {/* 장바구니에 담는 로직 실행 (API 호출) */}
              장바구니 담기
            </Button>
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ minWidth: 140, fontWeight: 700 }}
              onClick={() => (window.location.href = "/order")}
            >
              바로 구매하기
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* 안내 섹션 */}
          <Box>
            <Typography variant="h6" fontWeight={700} gutterBottom>
              배송정보
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              - 평균 2~3일 이내 출고 (주말/공휴일 제외)
              <br />- 도서산간/제주 지역은 추가 배송비가 발생할 수 있습니다.
            </Typography>
            <Typography variant="h6" fontWeight={700} gutterBottom mt={2}>
              교환 및 반품 안내
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              - 상품 수령 후 7일 이내 교환/반품 신청 가능
              <br />- 단순 변심 시 왕복 배송비가 부과될 수 있습니다.
              <br />- 상품 및 포장 상태가 훼손된 경우 교환/반품이 제한될 수
              있습니다.
            </Typography>
            <Typography variant="h6" fontWeight={700} gutterBottom mt={2}>
              환불 안내
            </Typography>
            <Typography variant="body2" color="text.secondary">
              - 환불은 반품 상품 회수 및 상태 확인 후 2~3영업일 이내 처리됩니다.
              <br />- 결제 수단에 따라 환불 소요 기간이 다를 수 있습니다.
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
