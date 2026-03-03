def key_extraction(js, key, path=None)->str | None:
    if path is None:
        path = []

    # String management
    if isinstance(js, str):
        return None

    # Dictionary management
    if isinstance(js, dict):
        for k, v in js.items():
            current_path = path + [k]
            if k == key:
                return current_path
            result = key_extraction(v, key, current_path)
            if result:
                return result

    # List-like management
    elif isinstance(js, (list, tuple, set)):
        for i, item in enumerate(js):
            current_path = path + [i]
            result = key_extraction(item, key, current_path)
            if result:
                return result

    return None

def path_construction(path_list : list)->str:
    if not path_list or not isinstance(path_list, list):
        return ""

    address = "root"
    for step in path_list:
        if isinstance(step, int):
            address += f"[{step}]"
        else:
            address += f"['{step}']"
    return address