#!/usr/bin/env bash

# always immediately exit upon error
set -e

# start in project root
cd "`dirname $0`/.."

./bin/require-clean-working-tree.sh

read -p "Have you already updated the changelog? (y/N): " updated_changelog
if [[ "$updated_changelog" != "y" ]]
then
	echo "Go do that!"
	exit 1
fi

read -p "Would you like to update dates in the demos? (y/N): " update_demos
if [[ "$update_demos" == "y" ]]
then
	./bin/update-demo-dates.sh
fi

read -p "Enter the new version number with no 'v' (for example '1.0.1'): " version
if [[ ! "$version" ]]
then
	echo "Aborting."
	exit 1
fi

# ensures stray files stay out of the release
gulp clean

# make sure deps are as new as possible for bundle
npm install

# update package manager json files with version number and release date
gulp bump --version=$version

# build all dist files and run tests
gulp release

# save reference to current branch
orig_ref=$(git symbolic-ref --quiet HEAD)

# make a tagged detached commit of the dist files.
# no-verify avoids commit hooks.
# make this a boolean expression that doesn't exit upon error.
git checkout --detach --quiet && \
git add *.json && \
git add -f dist/*.js dist/*.css dist/locale/*.js && \
git commit -e -m "version $version" && \
git tag -a "v$version" -m "version $version" || true

# if failure building the commit, there will be leftover .json changes.
# always discard. won't be harmful otherwise.
git checkout "$orig_ref" -- *.json

# go back to the original branch.
# need to reset so dist files are not staged.
# this will be executed regardless of whether the commit was built correctly.
git symbolic-ref HEAD "$orig_ref"
git reset

echo "DONE"
