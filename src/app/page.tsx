import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Main from "@/components/Main";

export default function Home() {
  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "background.default", py: { xs: 1.5, sm: 2 } }}>
      <Container maxWidth="md">
        <Box textAlign="center" mb={1.5}>
          <Typography variant="h5" component="h1" fontWeight={700} sx={{ fontSize: { xs: "1.3rem", sm: "1.6rem" } }}>
            🧭 IPv4アドレス ネットワーク部・ホスト部 見える化
          </Typography>
          <Typography variant="body2" color="text.secondary">
            サブネットマスクで、IPアドレスのどこが「ネットワーク」でどこが「機器の番号」なのかを色分けして確かめよう
          </Typography>
        </Box>
        <Main />
      </Container>
    </Box>
  );
}
