import os
import shutil
import subprocess


output_dir = "out"
script_tag = "[OT-App frontend build] "
script_tab = "                    "

# The project_root_dir depends on the location of this file, so it cannot be
# moved without updating this line
project_root_dir = \
    os.path.dirname(                                  # going up 1 level
        os.path.dirname(os.path.realpath(__file__)))  # folder dir of this


def get_ignore_regex():
    ignore_list = [
        "node_modules/electron-prebuilt",
        "node_modules/electron-builder",
        "backend$",
        "scripts",
        "tests",
        "docs",
        ".node-version",
        ".python-version",
        ".git",
        ".idea",
        ".*.md$",
        "releases",
        "test",
        "requirements.txt",
        "LICENSE",
    ]
    return '(' +  '|'.join(ignore_list) + ')'


def build_electron_app():
    print(script_tag + "Running electron-packager process.")

    process_args = [
        shutil.which("electron-packager"),
        project_root_dir,
        "OpenTrons",
        "--platform", "darwin",
        "--arch", "x64",
        "--out", "out",
        "--icon", os.path.join(project_root_dir, "build-assets", "icon.ico"),
        "--ignore", get_ignore_regex(),
        "--asar", "true",
        "--overwrite",
        "--prune",
    ]

    electron_packager_process = subprocess.Popen(process_args)
    electron_packager_process.communicate()

    if electron_packager_process.returncode != 0:
        raise SystemExit(script_tag + 'Failed to properly build electron app')


if __name__ == '__main__':
    build_electron_app()
