"""Dump the attack animation timings of the player into data-raw/attack_timing.json (git-ignored).

Personal-use tool. Weapon attacks name an animation trigger (ItemDrop.m_attack.m_attackAnimation,
for example "swing_longsword"). The player's AnimatorController maps each trigger, with a chain
index appended ("swing_longsword0", "swing_longsword1", ...), to a state and an animation clip. The
clip carries timed events that drive the game: "Hit" (damage lands), "Chain" (the next attack of a
combo may start) and "Speed" (playback speed factor from that moment on). This tool writes those raw
numbers per trigger; build_data.py copies them into data/weapons.json and the app derives attacks
per second from them.

Usage (Python 3.10+):
    pip install UnityPy
    python tools/extract/extract_attack_timing.py "D:/SteamLibrary/steamapps/common/Valheim" data-raw
"""

import json
import os
import sys

import UnityPy

from extract_icons import Bundles, cab_to_bundle, target_of

CONTROLLER = 'Player_animator'
KEEP_EVENTS = {'Hit', 'Chain', 'Speed', 'TrailOn', 'TrailOff'}


def find_controller(bundles_dir):
    for name in sorted(os.listdir(bundles_dir)):
        env = UnityPy.load(os.path.join(bundles_dir, name))
        for obj in env.objects:
            if obj.type.name == 'AnimatorController' and obj.read().m_Name == CONTROLLER:
                return name, obj.path_id
    raise SystemExit(f'{CONTROLLER} not found in {bundles_dir}')


def unwrap(x):
    return x['data'] if isinstance(x, dict) and 'data' in x else x


def main(game_dir, raw_dir):
    bundles_dir = os.path.join(game_dir, 'valheim_Data', 'StreamingAssets', 'SoftRef', 'Bundles')
    bundle, path_id = find_controller(bundles_dir)
    print(f'{CONTROLLER} is in bundle {bundle}', flush=True)
    bundles = Bundles(bundles_dir)
    cabs = cab_to_bundle(bundles_dir)

    env = bundles.env(bundle)
    obj = next(o for a in env.assets for o in a.objects.values() if o.path_id == path_id)
    tree = obj.read_typetree()
    tos = {}
    for entry in tree['m_TOS']:
        key, value = (entry[0], entry[1]) if isinstance(entry, (list, tuple)) else (entry['first'], entry['second'])
        tos[key] = value
    machine = unwrap(tree['m_Controller']['m_StateMachineArray'][0])
    states = [unwrap(s) for s in machine['m_StateConstantArray']]

    def clip_of(state):
        for tree_c in state['m_BlendTreeConstantArray']:
            for node in unwrap(tree_c)['m_NodeArray']:
                node = unwrap(node)
                if node['m_ChildIndices'] == [] and node['m_ClipID'] < len(tree['m_AnimationClips']):
                    return tree['m_AnimationClips'][node['m_ClipID']]
        return None

    out = {}
    for transition in machine['m_AnyStateTransitionConstantArray']:
        transition = unwrap(transition)
        conditions = [unwrap(c) for c in transition['m_ConditionConstantArray']]
        if len(conditions) != 1 or conditions[0]['m_ConditionMode'] != 1:  # one "trigger fired" condition
            continue
        trigger = tos.get(conditions[0]['m_EventID'])
        state = states[transition['m_DestinationState']]
        ptr = clip_of(state)
        if not trigger or not ptr:
            continue
        # Exit time of the first transition leaving the state with an exit time.
        exit_time = next(
            (unwrap(t)['m_ExitTime'] for t in state['m_TransitionConstantArray'] if unwrap(t)['m_HasExitTime']),
            None,
        )
        target, clip_id = target_of(bundles, cabs, bundle, path_id, ptr)
        clip = None
        if target:
            for asset in bundles.env(target).assets:
                o = asset.objects.get(clip_id)
                if o is not None:
                    clip = o.read_typetree()
                    break
        if not clip:
            continue
        muscle = clip['m_MuscleClip']
        out[trigger] = {
            'state': tos.get(state['m_NameID']),
            'stateSpeed': state['m_Speed'],
            'exitTime': exit_time,
            'clip': clip['m_Name'],
            'lengthSec': muscle['m_StopTime'] - muscle['m_StartTime'],
            'events': [
                {'t': e['time'], 'fn': e['functionName'], 'f': e['floatParameter'], 'i': e['intParameter']}
                for e in clip['m_Events']
                if e['functionName'] in KEEP_EVENTS
            ],
        }
    with open(os.path.join(raw_dir, 'attack_timing.json'), 'w', encoding='utf8') as f:
        json.dump(out, f, indent=1)
    print(f'{len(out)} attack triggers with timing -> {raw_dir}/attack_timing.json')


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    main(*sys.argv[1:])
