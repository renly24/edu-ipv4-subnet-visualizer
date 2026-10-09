"use client";
import { useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  LEVELS,
  QUESTIONS_PER_SET,
  analyze,
  correctAnswer,
  formatOctets,
  makeQuestions,
  parseOctet,
  prefixToMask,
  toBinary8,
  type Level,
  type Question,
} from "@/lib/subnet";
import AndTable from "./AndTable";
import BitStrip from "./BitStrip";
import SplitOctet from "./SplitOctet";
import { HOST_COLOR, NETWORK_COLOR } from "./colors";

type AnswerRecord = {
  question: Question;
  /** 表示用の自分の答え（「/24」や「192.168.1.0」） */
  answer: string;
  correct: boolean;
  usedHint: boolean;
};

type Phase = "menu" | "quiz" | "result";

export default function Quiz() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [level, setLevel] = useState<Level>(1);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null); // レベル1の答え
  const [inputs, setInputs] = useState(["", "", "", ""]); // レベル2・3の答え
  const [error, setError] = useState("");
  const [hint, setHint] = useState(false);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const question = questions[index];
  const current = records[index]; // 回答済みならある

  function resetAnswer() {
    setSelected(null);
    setInputs(["", "", "", ""]);
    setHint(false);
    setError("");
  }

  function start(lv: Level) {
    setLevel(lv);
    setQuestions(makeQuestions(lv));
    setIndex(0);
    setRecords([]);
    resetAnswer();
    setPhase("quiz");
  }

  function submit() {
    if (!question || current) return;
    let answer: string;
    if (question.level === 1) {
      if (selected === null) {
        setError("ネットワーク部の最後のビットをクリックしてください");
        return;
      }
      answer = `/${selected}`;
    } else {
      const octets = inputs.map(parseOctet);
      const bad = octets.findIndex((o) => o === null);
      if (bad !== -1) {
        setError("0〜255の整数を入力してください");
        inputRefs.current[bad]?.focus();
        return;
      }
      answer = octets.join(".");
    }
    setError("");
    setRecords([...records, { question, answer, correct: answer === correctAnswer(question), usedHint: hint }]);
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinishedAt(new Date());
      setPhase("result");
      return;
    }
    setIndex(index + 1);
    resetAnswer();
    setTimeout(() => inputRefs.current[0]?.focus(), 0);
  }

  function handleChange(i: number, value: string) {
    // 「.」を打ったら次の欄へ移る
    if (value.endsWith(".")) {
      inputRefs.current[i + 1]?.focus();
      value = value.slice(0, -1);
    }
    const v = value.replace(/\D/g, "").slice(0, 3);
    setInputs(inputs.map((s, j) => (j === i ? v : s)));
    if (v.length === 3 && i < 3) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (current) next();
    else submit();
  }

  if (phase === "menu") {
    return (
      <Box>
        <Typography variant="body1" sx={{ mb: 2 }}>
          レベルを選んでスタート。1セット {QUESTIONS_PER_SET} 問です。
        </Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" } }}>
          {LEVELS.map((l) => (
            <Card key={l.level}>
              <CardActionArea onClick={() => start(l.level)} sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {l.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {l.description}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>
    );
  }

  if (phase === "result") {
    const score = records.filter((r) => r.correct).length;
    const levelInfo = LEVELS.find((l) => l.level === level)!;
    return (
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" fontWeight={700}>
          結果：{levelInfo.title}
        </Typography>
        <Typography variant="h3" fontWeight={700} color="primary" sx={{ my: 1 }}>
          {score} / {records.length} 問正解
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          ヒント使用：{records.filter((r) => r.usedHint).length} 問　／　{finishedAt?.toLocaleString("ja-JP")}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          この画面をスクリーンショットして提出してください（結果はどこにも保存されません）。
        </Typography>
        <Box>
          {records.map((r, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, py: 0.75, borderTop: 1, borderColor: "divider", flexWrap: "wrap" }}>
              <Chip size="small" label={r.correct ? "○" : "×"} color={r.correct ? "success" : "error"} />
              <Typography variant="body2" sx={{ fontFamily: "monospace", flex: "1 1 260px" }}>
                {formatOctets(r.question.ip)}　マスク {formatOctets(prefixToMask(r.question.prefix))}
              </Typography>
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                → <strong>{correctAnswer(r.question)}</strong>
                {!r.correct && (
                  <Box component="span" sx={{ color: "error.main", ml: 1 }}>
                    （あなたの答え：{r.answer}）
                  </Box>
                )}
                {r.usedHint && (
                  <Box component="span" sx={{ color: "text.secondary", ml: 1 }}>
                    ヒント
                  </Box>
                )}
              </Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={() => start(level)}>
            同じレベルでもう一度
          </Button>
          <Button variant="outlined" onClick={() => setPhase("menu")}>
            レベル選択にもどる
          </Button>
        </Box>
      </Paper>
    );
  }

  const mask = prefixToMask(question.prefix);
  const info = analyze(question.ip, question.prefix);
  const splitIndex = question.prefix % 8 !== 0 ? Math.floor(question.prefix / 8) : null;
  const prompt =
    question.level === 1
      ? "サブネットマスクを見て、IPアドレスのネットワーク部の「最後のビット」をクリックしよう"
      : question.level === 2
        ? "このアドレスが属するネットワークの「ネットワークアドレス」を答えよう"
        : "このアドレスが属するネットワークの「ブロードキャストアドレス」を答えよう";

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {LEVELS.find((l) => l.level === level)!.title}　第 {index + 1} 問 / {questions.length}
        </Typography>
        <Button size="small" onClick={() => setPhase("menu")}>
          やめる
        </Button>
      </Box>
      <LinearProgress variant="determinate" value={(records.length / questions.length) * 100} sx={{ mb: 2, borderRadius: 1 }} />

      <Typography variant="body1" fontWeight={700}>
        {prompt}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          columnGap: 2,
          rowGap: 0.5,
          alignItems: "baseline",
          my: 2,
          p: 1.5,
          borderRadius: 1,
          bgcolor: "#f5f5f5",
          "& .v": { fontFamily: "monospace", fontWeight: 700, fontSize: { xs: "1.2rem", sm: "1.6rem" } },
        }}
      >
        <Typography variant="body2" color="text.secondary">
          IPアドレス
        </Typography>
        <Box className="v">{formatOctets(question.ip)}</Box>
        <Typography variant="body2" color="text.secondary">
          サブネットマスク
        </Typography>
        <Box className="v">
          {formatOctets(mask)}
          {/* レベル1は /N を見せると答えになってしまうので出さない */}
          {question.level !== 1 && (
            <Box component="span" sx={{ color: "text.secondary", fontSize: "0.7em" }}>
              （/{question.prefix}）
            </Box>
          )}
        </Box>
      </Box>

      {question.level === 1 ? (
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" sx={{ mb: 0.5 }}>
            IPアドレス（2進数）　{selected !== null && !current && `いまの答え：/${selected}`}
          </Typography>
          <BitStrip
            ip={question.ip}
            prefix={current ? question.prefix : selected}
            onSelectPrefix={current ? undefined : (p) => setSelected(p)}
          />
        </Box>
      ) : (
        <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 0.5, mb: 1 }}>
          {inputs.map((v, i) => (
            <Box key={i} sx={{ display: "flex", alignItems: "flex-end", gap: 0.5 }}>
              <TextField
                value={v}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={handleKeyDown}
                inputRef={(el) => {
                  inputRefs.current[i] = el;
                }}
                autoFocus={i === 0}
                disabled={!!current}
                placeholder="0〜255"
                size="small"
                error={!!current && !current.correct && current.answer.split(".")[i] !== correctAnswer(question).split(".")[i]}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    "aria-label": `第${i + 1}オクテット`,
                    style: { textAlign: "center", fontFamily: "monospace", fontSize: "1.2rem" },
                  },
                }}
                sx={{ width: { xs: 68, sm: 90 } }}
              />
              {i < 3 && (
                <Typography fontWeight={700} fontSize="1.5rem">
                  .
                </Typography>
              )}
            </Box>
          ))}
        </Box>
      )}
      {error && (
        <Alert severity="warning" sx={{ mb: 1 }}>
          {error}
        </Alert>
      )}

      {!current ? (
        <Box sx={{ display: "flex", gap: 1, justifyContent: "center", mt: 2 }}>
          <Button variant="outlined" onClick={() => setHint(true)} disabled={hint}>
            ヒント
          </Button>
          <Button variant="contained" onClick={submit}>
            答え合わせ
          </Button>
        </Box>
      ) : (
        <Alert severity={current.correct ? "success" : "error"} sx={{ mt: 2 }}>
          {current.correct ? "正解！" : `ざんねん… 正解は ${correctAnswer(question)} です。`}
        </Alert>
      )}

      {hint && !current && (
        <Box sx={{ mt: 2, p: 1.5, borderRadius: 1, bgcolor: "#fff8e1" }}>
          <Typography variant="body2" fontWeight={700} gutterBottom>
            💡 ヒント
          </Typography>
          {question.level === 1 ? (
            <>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                サブネットマスクを2進数にすると、1が続くところがネットワーク部です。
              </Typography>
              <Typography sx={{ fontFamily: "monospace", fontWeight: 700, wordBreak: "break-all" }}>
                {mask.map(toBinary8).join(".")}
              </Typography>
            </>
          ) : (
            <>
              <Typography variant="body2" sx={{ mb: 1 }}>
                /{question.prefix} なので、左{question.prefix}ビットがネットワーク部、残り{32 - question.prefix}ビットがホスト部です。
                {question.level === 2 ? "ホスト部をすべて0" : "ホスト部をすべて1"}にしよう。
              </Typography>
              <BitStrip ip={question.ip} prefix={question.prefix} />
            </>
          )}
        </Box>
      )}

      {current && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" fontWeight={700} gutterBottom>
            解説
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            サブネットマスク {formatOctets(mask)} は2進数で1が{question.prefix}個 → /{question.prefix}。
            <Box component="span" sx={{ color: NETWORK_COLOR, fontWeight: 700 }}>
              左{question.prefix}ビットがネットワーク部
            </Box>
            、
            <Box component="span" sx={{ color: HOST_COLOR, fontWeight: 700 }}>
              残り{32 - question.prefix}ビットがホスト部
            </Box>
            です。
          </Typography>
          {question.level !== 1 && <BitStrip ip={question.ip} prefix={question.prefix} />}
          {splitIndex !== null && (
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 1, bgcolor: "#fafafa", border: 1, borderColor: "divider" }}>
              <SplitOctet value={question.ip[splitIndex]} index={splitIndex} netBits={question.prefix - splitIndex * 8} />
            </Box>
          )}
          {question.level !== 1 && (
            <Box sx={{ mt: 1.5 }}>
              <AndTable ip={question.ip} mask={mask} network={info.network} broadcast={info.broadcast} prefix={question.prefix} />
            </Box>
          )}
        </Box>
      )}

      {current && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Button variant="contained" onClick={next} autoFocus>
            {index + 1 >= questions.length ? "結果を見る" : "次の問題"}
          </Button>
        </Box>
      )}
    </Paper>
  );
}
