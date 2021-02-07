/**
 * defines the structure of the archive file extraction or single bigip.conf
 */
export declare type ConfigFiles = {
    fileName: string;
    size: number;
    content: string;
}[];
/**
 * extracts needed config files from archive
 * @param input path/file to .conf|.ucs|.qkview|.gz
 */
export declare function unPacker(input: string): Promise<ConfigFiles>;
