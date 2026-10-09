import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const TOPICS: { title: string; body: React.ReactNode }[] = [
  {
    title: "ネットワーク部とホスト部って？",
    body: (
      <>
        IPv4アドレス（32ビット）は、前半の<strong>ネットワーク部</strong>と後半の<strong>ホスト部</strong>に分かれています。
        住所にたとえると、ネットワーク部が「町名」、ホスト部が「番地」です。同じネットワーク部をもつ機器どうしは、ルータを通さずに直接通信できます。
      </>
    ),
  },
  {
    title: "サブネットマスクの読み方",
    body: (
      <>
        サブネットマスクは、IPアドレスのどこまでがネットワーク部かを表す32ビットの値です。2進数にすると左から1が続き、途中から0だけになります。
        1の部分がネットワーク部、0の部分がホスト部です。1の個数を「/24」のように書く方法を<strong>プレフィックス表記（CIDR表記）</strong>といいます。
        例：255.255.255.0 = 11111111.11111111.11111111.00000000 = /24
      </>
    ),
  },
  {
    title: "ネットワークアドレスとブロードキャストアドレス",
    body: (
      <>
        ホスト部がすべて0のアドレスは<strong>ネットワークアドレス</strong>（ネットワークそのものの名前）、すべて1のアドレスは
        <strong>ブロードキャストアドレス</strong>（ネットワーク内の全員あて）です。この2つは機器に割り当てられないので、
        つなげられる機器の数は「2^ホスト部のビット数 − 2」になります。
      </>
    ),
  },
  {
    title: "/24 以外のときは2進数で考える",
    body: (
      <>
        /8・/16・/24 のときは、境目がちょうどオクテット（8ビット）の区切りにあるので、10進数のままでも分けられます。
        /26 などのときは、境目が1つのオクテットの途中にくるので、そのオクテットを2進数に直して考えます。
        上の「② ネットワーク部とホスト部を見る」で、スライダーを /26 や /28 にして確かめてみましょう。
      </>
    ),
  },
];

export default function Lesson() {
  return (
    <div>
      <Typography variant="subtitle1" component="h2" fontWeight={700} sx={{ mb: 1 }}>
        📘 しくみ
      </Typography>
      {TOPICS.map((t) => (
        <Accordion key={t.title} disableGutters>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={700}>{t.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" lineHeight={1.8}>
              {t.body}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </div>
  );
}
