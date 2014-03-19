#!/bin/bash

OWNER=$1
MODULE_DIRS=`ls -A1`
for DIR in `echo $MODULE_DIRS`
do
    pushd .
    cd $DIR
    npm owner add $OWNER $DIR
    popd
done
