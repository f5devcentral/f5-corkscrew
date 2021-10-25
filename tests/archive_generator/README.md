# BIG-IP Archive generator

10.25.2021

The idea here is to create an TMOS archive generator.

Let me back up...

UCS and QKVIEWs can get very big.  Typically bigger than what github allows.  So this public repo does not contain the archives the tests use.  They are only on my local disk.  Also, we are only using a small portion of the archive (key folders).

The thought here is to create a directory structure, similar to an archive, of all the files needed for testing.

Then the tests can create a temp archive before running, or we can update most of the tests/functions to call the test files/data directly.  For now, we don't care about any of the other archive files include in ucs/qkviews

## notes

K58543794: How to decrypt a UCS file with a passphrase?
https://support.f5.com/csp/article/K58543794

```bash
C:\Users\f5user\ExamplePath> gpg --output <DecryptedFileName> --decrypt <UCS file name>
```

K5437: Encryption used for UCS file creation
https://support.f5.com/csp/article/K5437

### gpg with node.js

https://www.loginradius.com/blog/async/using-pgp-encryption-with-nodejs/

### DevCentral Example

https://devcentral.f5.com/s/question/0D51T00006i7N3x/is-ucs-file-editable-if-so-how-to-compress-it-back-

* Create a directory to old the contents of the archive
  * mkdir ucs
* Change to the new ucs directory
  * cd ucs
* extract the files from the archive
  * gzip -dc /full/path/to/whatever.ucs | tar xvpf -

* Edit whichever files you want...

* Create a new ucs file
  * tar cvf - * | gzip -c > /full/path/to/whatever_new.ucs

## Directory/File Structur

### files/directories from both UCS/QKVIEWS

```bash
/config/bigip*.conf
/config/partitions/*
/config/bigip.conf
/config/bigip_base.conf
/config/bigip.license
/config/profile_base.conf
```

### UCS specific

```bash
/var/tmp/filestore_temp/files_d/<partition_name>/*
```

!> exclude epsec_package_d and datasync_update_files_d directories in each partition

### QKVIEW specific

```bash
/config/filestore/files_d/<parition_name>/*
```

!> exclude epsec_package_d and datasync_update_files_d directories in each partition

### mini_ucs

Details on how we build a mini_ucs

<https://github.com/f5devcentral/f5-conx-core/blob/43b4689c6d1e0c4b532cb44641ef7e7b63d3746c/src/bigip/ucsClient.ts#L121>

```TS
// build mini ucs
// https://unix.stackexchange.com/questions/167717/tar-a-list-of-files-which-dont-all-exist
const ucsCmd = [
    'tar',
    '-czf',
    `${F5DownloadPaths.ucs.path}${fileN}`,
    '-C',
    '/',
    'config/bigip.conf',
    'config/bigip_gtm.conf',
    'config/bigip_base.conf',
    'config/bigip_user.conf',
    'config/bigip_script.conf',
    'config/profile_base.conf',
    'config/low_profile_base.conf',
    'config/user_alert.conf',
    'config/bigip.license',
    'config/partitions',
    '/config/filestore/files_d'
];
```
