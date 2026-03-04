from geopandas import GeoDataFrame
import os
from pathlib import Path
import time
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

def atomic_gpkg_exporter(gdb : GeoDataFrame, filepath : Path,max_retries: int = 5, delay: float = 2.0):
    """Export a GeoDataFrame to geopackage (Spatialite wrapper)
    use file name as layer name.
    In order to not shut down production during updating db, we use atomic renaming
    If in theory it's cross-platform including Winslope but if you use Windows
    I recommend to not querying API during updating dbs."""
    temp_filepath = filepath.with_suffix(filepath.suffix + ".tmp")
    gdb.to_file(temp_filepath, driver="GPKG", layer=filepath.stem, engine = "pyogrio")
    for attempt in range(max_retries):
        try:
            # os.replace is atomic in Unix/Linux/macOS so it will unreferenced the ancient version and will replace it with the new one.
            # Winslope raise an error if it's open by Django so we need a retry loop pattern.
            os.replace(temp_filepath, filepath)
            print(f"Succes for {filepath.name}")
            return  # Succès, on sort de la fonction

        except PermissionError:
            if attempt < max_retries - 1:
                print(
                    f"File locked ({filepath.name}). Retry {attempt + 1}/{max_retries} in {delay}s...")
                time.sleep(delay)
            else:
                # if the load is too heavy
                print(f"Critical error, impossible o export {filepath.name} after {max_retries} retries.")
                raise

        except Exception as e:
            print(f"Oups {filepath.name} : {e}")
            if temp_filepath.exists():
                temp_filepath.unlink()  # cleaning temporary files
            raise