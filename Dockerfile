FROM ubuntu:22.04 AS base
RUN apt-get -y update && \
    apt-get -y install \
    --no-install-recommends \
      build-essential \
      ca-certificates \
      git \
      openssh-client \
      python3 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

FROM base
CMD bash
ARG DEBIAN_FRONTEND=noninteractive
RUN apt-get -y update && \
    apt-get -y install \
    --no-install-recommends \
      ruby-bundler \
      ruby-dev \
      ruby-full \
      zlib1g-dev \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV GEM_HOME=/usr/local/bundle
ENV BUNDLE_PATH=/usr/local/bundle
ENV BUNDLE_BIN=/usr/local/bundle/bin
ENV BUNDLE_SILENCE_ROOT_WARNING=1
ENV PATH=/usr/local/bundle/bin:${PATH}

WORKDIR /workspace
