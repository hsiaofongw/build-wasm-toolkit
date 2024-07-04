"use client";

import { Fragment, useState } from "react";
import { Main } from "./main";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function Page() {
  const [text, setText] = useState("");
  return (
    <Fragment>
      <QueryClientProvider client={queryClient}>
        <Main />
      </QueryClientProvider>
    </Fragment>
  );
}
