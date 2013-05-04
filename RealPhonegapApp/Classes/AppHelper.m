//
//  AppHelper.m
//  MobileAppDemo
//
//  Created by Keith Wedinger on 9/24/12.
//
//

#import "AppHelper.h"

@implementation AppHelper

// This method will copy our prepopulated database
- (void) copyDatabaseFiles
{
    NSString *masterName = @"Databases.db";
    NSString *databaseName = @"0000000000000001.db";
    
    NSArray *libraryPaths = NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES);
    NSString *libraryDir = [libraryPaths objectAtIndex:0];
    
    NSString *masterPath = [libraryDir stringByAppendingPathComponent:@"Caches/"];
    NSString *databasePath = [libraryDir stringByAppendingPathComponent:@"Caches/file__0/"];
    NSString *masterFile = [masterPath stringByAppendingPathComponent:masterName];
    NSString *databaseFile = [databasePath stringByAppendingPathComponent:databaseName];
    
    NSFileManager *fileManager = [NSFileManager defaultManager];
    
    if ( ![fileManager fileExistsAtPath:databasePath] ) {
        NSString *databaseSourcePath = [[[NSBundle mainBundle] resourcePath] stringByAppendingPathComponent:@"database"];
        NSString *masterPathFromApp = [databaseSourcePath stringByAppendingPathComponent:masterName];
        NSLog( @"Master source path: %@", masterPathFromApp );
        NSString *databasePathFromApp = [[databaseSourcePath stringByAppendingPathComponent:@"file__0"] stringByAppendingPathComponent:databaseName];
        NSLog( @"Database source path: %@", databasePathFromApp );
        
        NSError *copyError;
        NSLog( @"Copying master DB file to %@", masterFile );
        [fileManager createDirectoryAtPath:databasePath withIntermediateDirectories:YES attributes:nil error:NULL];
        if ( [fileManager copyItemAtPath:masterPathFromApp toPath:masterFile error:&copyError] ) {
            NSLog( @"Master DB file copied successfully" );
        } else {
            NSLog( @"Master file copy failed: %@", [copyError localizedDescription] );
        }
        NSLog( @"Copying prepopulated database file to %@", databaseFile );
        if ( [fileManager copyItemAtPath:databasePathFromApp toPath:databaseFile error:&copyError] ) {
            NSLog( @"Prepopulated database file copied successfully" );
        } else {
            NSLog( @"Prepopulated atabase file copy failed: %@", [copyError localizedDescription] );
        }
    }
}

@end
