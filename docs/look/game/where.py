"""Where the frames of the game go: outside the repository, pictures never enter git.

The folder is PLN_SHOTS if it is set, else <temp>/drift-planet-shots. Scene snippets written
by at.py and world.py lie there too, next to the frames they make.
"""
import os
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))


def shots():
    d = os.environ.get("PLN_SHOTS") or os.path.join(tempfile.gettempdir(), "drift-planet-shots")
    os.makedirs(d, exist_ok=True)
    return d


def find(name):
    """A file by name: in the folder of frames first, then beside the tools; None if it is not a file."""
    for base in (shots(), HERE):
        p = os.path.join(base, name)
        if os.path.isfile(p):
            return p
    return name if os.path.isfile(name) else None
