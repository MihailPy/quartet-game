FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod ./
COPY go.sum* ./

RUN go mod download

COPY . .

RUN go build -o quartet-game ./cmd/api

FROM alpine:latest

WORKDIR /app

COPY --from=builder /app/quartet-game .

EXPOSE 8080

CMD ["./quartet-game"]
