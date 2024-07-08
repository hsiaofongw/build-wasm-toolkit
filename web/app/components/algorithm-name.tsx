import { useMemo } from "react";
import { DigestId } from "../types";

export function useHashAlgNameMap() {
  const m = useMemo(() => {
    const m: Record<string, string> = {};
    m[String(DigestId.MD5)] = "MD5";
    m[String(DigestId.SHA1)] = "SHA1";
    m[String(DigestId.SHA224)] = "SHA224";
    m[String(DigestId.SHA256)] = "SHA256";
    m[String(DigestId.SHA384)] = "SHA384";
    m[String(DigestId.SHA512)] = "SHA512";
    m[String(DigestId.SM3)] = "SM3";
    return m;
  }, []);

  return {
    getName: (t: string | number) => {
      const x = String(t);
      if (x in m) {
        return m[x];
      }
      return x;
    },
  };
}

export function AlgorithmName(props: { algId: DigestId }) {
  const { getName } = useHashAlgNameMap();
  return <>{getName(props.algId)}</>;
}
