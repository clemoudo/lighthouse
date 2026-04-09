FROM postgres:18-alpine

RUN apk add --no-cache --virtual .build-deps \
    git \
    build-base \
    clang19-dev \
    llvm19-dev

RUN git clone --branch v0.8.2 https://github.com/pgvector/pgvector.git /tmp/pgvector \
    && cd /tmp/pgvector \
    && make \
    && make install \
    && rm -rf /tmp/pgvector

RUN apk del .build-deps
