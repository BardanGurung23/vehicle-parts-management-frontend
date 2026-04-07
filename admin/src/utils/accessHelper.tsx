import { useAppSelector } from "@/redux/store/hooks";

function checkAccess(module: string) {
  const access = useAppSelector((state) => state.auth.clientAccess);

  const moduleAccess = access
    .filter((each) => each.list === module)
    .map((each) => each.key);

  return moduleAccess;
}

function checkViewAccessList() {
  const access = useAppSelector((state) => state.auth.clientAccess);
  const viewAccessList = access
    .filter((each) => each.key === "view")
    .map((each) => each.list);
  return viewAccessList;
}

export { checkAccess, checkViewAccessList };
